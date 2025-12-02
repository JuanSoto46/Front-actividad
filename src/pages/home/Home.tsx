import Chat from "./chat/Chat";
import Interaction from "./interaction/Interaction";

const Home: React.FC = () => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Interaction />
      <div className="w-96">
        <Chat />
      </div>
    </div>
  );
};

export default Home;