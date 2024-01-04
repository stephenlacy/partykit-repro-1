import type * as Party from "partykit/server";

interface Message {
  type: string;
  payload: any;
}

export default class Server implements Party.Server {
  options: Party.ServerOptions = {
    hibernate: true,
  };
  constructor(readonly party: Party.Party) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.party.id}
  url: ${new URL(ctx.request.url).pathname}`
    );

    const members = this.getMembers();

    if (members.length > 10) {
      conn.send(JSON.stringify({ type: "error", payload: "Party is full" }));
      conn.close();
      return;
    }

    // let's send a message to the connection
    this.party.broadcast(JSON.stringify({ type: "members", payload: members }));
  }

  getMembers() {
    const connections = this.party.getConnections();
    const members = [];
    for (const c of connections) {
      members.push({ id: c.id, ...c.state });
    }
    return members;
  }

  async onMessage(message: string, sender: Party.Connection) {
    console.log(`connection ${sender.id} sent message: ${message}`);
    const msg = JSON.parse(message) as Message;

    if (msg.type === "count") {
      const count = ((await this.party.storage.get("count")) as number) || 0;
      await this.party.storage.put("count", count + 1);
      this.party.broadcast(
        JSON.stringify({ type: "count", payload: count + 1 })
      );
    }

    if (msg.type === "self") {
      const update = { ...sender.state, ...msg.payload };
      sender.setState(update);
      sender.send(JSON.stringify({ type: "self", payload: update }));
      this.party.broadcast(
        JSON.stringify({ type: "members", payload: this.getMembers() })
      );
    }

    if (msg.type === "fetch") {
      if (msg.payload === "self") {
        const state = sender.state;
        if (!state) return;
        return sender.send(
          JSON.stringify({ type: msg.payload, payload: state })
        );
      }
      const state = await this.party.storage.get(msg.payload);
      if (!state) return;
      sender.send(JSON.stringify({ type: msg.payload, payload: state }));
    }
  }

  async onClose(connection: Party.Connection<unknown>): void | Promise<void> {}
}

Server satisfies Party.Worker;
