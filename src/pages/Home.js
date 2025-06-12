import React, { useState }  from "react";
import {v4 as uuidv4} from 'uuid';
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Home =() =>{

    const navigate = useNavigate();

    const[roomID,setRoomID]= useState('');
    const[username,setUserName]= useState('');

    const createNewRoom = (e) => {
        e.preventDefault();
        const id= uuidv4();
        setRoomID(id);
        toast.success('Room created successfully');
    };

    const joinRoom = () => {
        if(!roomID || !username){
            toast.error('Please enter Room ID and UserName');
            return;
        }
        //Redirect
        navigate(`/editor/${roomID}`, {
            state: {
                username,
            },
        });
    };

    const handleInputEnter = (e) => {
        if(e.code==='Enter'){
            joinRoom();
        }
    };


    return <div className="homePageWrapper">
        <div className="formWrapper">
            <img className="homeLogo" src="/logo.png" alt="logo" ></img>
            <h4 className="mainLabel">Paste invitation ROOM ID</h4>

            <div className="inputGroup">
                <input 
                    type="text" 
                    className="inputBox" 
                    placeholder="Room ID"
                    onChange={(e) => setRoomID(e.target.value)}
                    value={roomID}
                    onKeyUp={handleInputEnter}
                ></input>

                <input 
                    type="text" 
                    className="inputBox" 
                    placeholder="UserName"
                    onChange={(e) => setUserName(e.target.value)}
                    value={username}
                    onKeyUp={handleInputEnter}
                ></input>

                <button className="btn joinBtn" onClick={joinRoom}>Join</button>
                <span className="createInfo">
                    Create a new room by clicking &nbsp;
                    <a onClick={createNewRoom} href=" " className="createNewBtn">new room</a>
                </span>
            </div>
        </div>
        <footer>
            <h4> Good to see you here 😊😊</h4>
        </footer>
        
    </div>;
}
export default Home