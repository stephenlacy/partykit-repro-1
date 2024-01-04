import { PARTYKIT_HOST } from "./config";
import usePartySocket from "partysocket/react";
import "./App.css";

import { PartyContext, useRealtimeState } from "./hooks/party";
import { useEffect } from "react";

function App() {
  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: "partytest",
  });

  return (
    <PartyContext.Provider value={socket}>
      <Page />
    </PartyContext.Provider>
  );
}

export default App;

function Page() {
  const [count, setCount] = useRealtimeState<number>("count", 0);
  console.log(count);
  const [members] = useRealtimeState<[]>("members", []);
  console.log(members);

  const [user, setUser] = useRealtimeState<{
    username: string;
    isReady?: boolean;
    id?: string;
  }>("self", { username: "" });
  console.log(user);

  const test = () => {
    setUser({ username: "test" });
  };

  return (
    <div>
      <h1>PartyKit</h1>

      <button onClick={() => setCount(count + 1)}>Increment {count}</button>
      <button onClick={test}>Test</button>
    </div>
  );
}
