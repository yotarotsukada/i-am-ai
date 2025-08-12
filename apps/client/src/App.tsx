import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Home from './components/Home';
import Room from './components/Room';
import UsernameForm from './components/UsernameForm';

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/join/:roomId" element={<UsernameForm />} />
            <Route path="/room/:roomId" element={<Room />} />
          </Routes>
        </div>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;