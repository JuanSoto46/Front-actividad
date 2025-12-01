import Chat from "./chat/Chat";
import Interaction from "./interaction/Interaction";

const Home: React.FC = () => {
  return (
    <>
    <div className="flex flex-row justify-center items-center bg-gray-200 dark:bg-gray-900 w-full h-full">
      <Interaction/>
      <Chat  />
    </div>
    </>
  );
};

export default Home;