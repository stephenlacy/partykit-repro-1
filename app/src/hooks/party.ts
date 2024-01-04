// Copyright 2024 Stephen Lacy

import PartySocket from "partysocket";
import { createContext, useContext, useEffect, useState } from "react";

export const PartyContext = createContext<PartySocket | null>(null);

export const useParty = () => {
  if (!PartyContext) throw new Error("PartyContext not found");
  return useContext(PartyContext);
};

export function useRealtimeState<T>(
  name: string,
  initialState: T,
  sync: boolean = true
) {
  const socket = useParty();
  if (!socket) throw new Error("Socket not found");
  const [state, setState] = useState<T>(initialState);
  const [temporaryState, setTemporaryState] = useState<T>(initialState);
  useEffect(() => {
    if (sync) {
      socket.send(JSON.stringify({ type: "fetch", payload: name }));
    }
    const listener = socket.addEventListener("message", (message) => {
      const msg = JSON.parse(message.data as string);
      if (msg.type === name) {
        setState(msg.payload);
        setTemporaryState(msg.payload);
      }
    });

    return () => {
      socket.removeEventListener("message", listener);
    };
  }, [socket]);

  const send = (payload: T) => {
    setTemporaryState(payload);
    socket.send(JSON.stringify({ type: name, payload }));
  };
  return [state, send, state !== temporaryState] as [
    T,
    (payload: T) => void,
    boolean,
  ];
}
