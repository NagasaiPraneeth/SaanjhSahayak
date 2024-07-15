import List from './doctor/List';
import Analytics from './doctor/Analytics';
import Navbar from './patient/Navbar';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MedicalChatbot from './MedicalChatbot';

export default function Main(props) {
    const [noofPatients, setNoofPatients] = useState(0);
    const navigate = useNavigate();

    
    
      return (
        <div
          className="relative flex size-full min-h-screen flex-col bg-[#f8fafb] group/design-root overflow-x-hidden"
          style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
          <div className="layout-container flex h-full grow flex-col">
              <Navbar isDoctor={props.isDoctor} />
            <div className="gap-1 px-6 flex flex-1 justify-center py-5">
                
                <List isDoctor={props.isDoctor} setNoofPatients={setNoofPatients} noofPatients={noofPatients}/>
                <Analytics noofPatients={noofPatients}/>

            </div>
          </div>
          <MedicalChatbot />
        </div>
      );
}