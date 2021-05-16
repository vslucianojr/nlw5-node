import { io } from "../http";
import { ConnectionsService } from "../services/ConnectionsService";
import { UsersService } from "../services/UsersService";
import { MessagesService } from "../services/MessagesService";

interface IParams {
  text: string;
  email: string;
}

io.on("connect", async (socket) => {
  const connectionsService = new ConnectionsService();
  const usersService = new UsersService();
  const messagesService = new MessagesService();

  socket.on("client_first_access", async (params: IParams) => {
    const socket_id = socket.id;
    const { text, email } = params;
    let user_id = null;

    const usersExists = await usersService.findByEmail(email);

    if (!usersExists) {
      const user = await usersService.create(email);

      await connectionsService.create({
        socket_id,
        user_id: user.id,
      });
      user_id = user.id;
    } else {
      const connection = await connectionsService.findByUserId(usersExists.id);

      if (!connection) {
        await connectionsService.create({
          socket_id,
          user_id: usersExists.id,
        });
      } else {
        connection.socket_id = socket_id;
        await connectionsService.create(connection);
      }
      user_id = usersExists.id;
    }

    await messagesService.create({
      text,
      user_id,
    });
  });
});