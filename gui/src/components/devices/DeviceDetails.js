import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';

import './DeviceDetails.css';

import Values from './Values';

import { deleteApi, getApi, putApi } from '../../apis/api';

const DEFAULT_HOME = {id: 'h0', name: '---', location: '', rooms: []};
const DEFAULT_ROOM = {id: 'r0', name: '---'};

export default function DeviceDetails() {
  const {state} = useLocation();
  const device = state.device;
  const navigate = useNavigate();

  const [homes, setHomes] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [selectedHome, setSelectedHome] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    async function fn() {
      try {
        const response = await getApi('/api/homes');
        const homes = [DEFAULT_HOME, ...response];
        setHomes(homes);

        let homeFound = DEFAULT_HOME;
        let roomFound = DEFAULT_ROOM;
        homes.forEach(home => {
          home.rooms.forEach(room => {
            if (room && room.devices && room.devices.find(dev => dev === device.id)) {
              homeFound = home;
              roomFound = room;
            }
          });
        });

        console.log('Init - homeFound: ', homeFound);
        console.log('Init - roomFound: ', roomFound);

        if (homeFound) {
          setRooms([DEFAULT_ROOM, ...homeFound.rooms])

          setSelectedHome(homeFound);
          setSelectedRoom(roomFound);
        }
      } catch (err) {
        console.error('Cannot get homes', err);
      }
    }

    fn();
  }, []);

  function onChangeHome(event) {
    if (!event || !event.target || !event.target.value) {
      return;
    }
    const home = homes.find(home => home.id === event.target.value.id)
    console.log('onChangeHome - home: ', home);

    setRooms([DEFAULT_ROOM, ...home.rooms])
    setSelectedHome(home);
    setSelectedRoom(DEFAULT_ROOM)
  }

  function onChangeRoom(event) {
    if (!event || !event.target || !event.target.value) {
      return;
    }
    const room = rooms.find(room => room.id === event.target.value.id)
    console.log('onChangeRoom - room: ', room);

    setSelectedRoom(room);
  }

  async function onSave() {
    console.log('onSave', {selectedHome, selectedRoom});
    const newRoom = Object.assign({}, selectedRoom);
    if (!newRoom.devices) {
      newRoom.devices = [device.id];
    } else {
      newRoom.devices.push(device.id);
    }
    try {
      await putApi(`/api/homes/${selectedHome.id}/rooms/${selectedRoom.id}`, newRoom);
      // navigate back
      navigate(-1);
    } catch (err) {
      console.error('Cannot save device assigning it to this room');
    }
  }

  async function onRemove() {
    console.log('onRemove');
    try {
      await deleteApi(`/api/devices/${device.id}?homeId=${selectedHome.id}&roomId=${selectedRoom.id}`);
      // navigate back
      navigate(-1);
    } catch (err) {
      console.error('Cannot remove device');
    }
  }

  return (
    <div className="DeviceDetails">
      <Typography variant="h2" component="h1">
        Device
      </Typography>
      <div className="DeviceDetailsContainer">
        <Typography variant="h5" component="h2">
          {device?.name} - {device?.manufacturer} - {device?.model}
        </Typography>
        <br/>

        {selectedHome &&
          <FormControl fullWidth>
            <InputLabel id="homes-select-label">Home</InputLabel>
            <Select
              labelId="homes-select-label"
              id="homes-select"
              value={selectedHome}
              label="home"
              onChange={onChangeHome}
            >
              {
                homes.map(home => <MenuItem key={home.id} value={home}>{home.name}</MenuItem>)
              }
            </Select>
          </FormControl>
        }

        <br/>

        {selectedRoom &&
          <FormControl fullWidth>
            <InputLabel id="rooms-select-label">Room</InputLabel>
            <Select
              labelId="rooms-select-label"
              id="rooms-select"
              value={selectedRoom}
              label="room"
              onChange={onChangeRoom}
            >
              {
                rooms.map(room => <MenuItem key={room.id} value={room}>{room.name}</MenuItem>)
              }
            </Select>
          </FormControl>
        }

        <br/>
        { selectedHome !== DEFAULT_HOME && selectedRoom !== DEFAULT_ROOM &&
          <Button onClick={() => onSave()}>Save</Button>
        }
        <br/>
        <Button onClick={() => onRemove()}>Remove this Device</Button>
        <br/>
        <div className="DeviceDetailsDivider"></div>

        <Values device={device}/>
      </div>
    </div>
  )
}

