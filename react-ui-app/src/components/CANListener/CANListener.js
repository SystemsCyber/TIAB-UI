import React, { useContext, useEffect, useState } from "react";
import { SocketContext } from "../../conf/SocketContext";

// Replace this with your actual WebSocket server endpoint
// const SOCKET_URL = `${config.API_BASE_URL}`;
// const socket = io(SOCKET_URL);

const CANListener = ({ selectedInterface, sourceAddresses, setSourceAddresses, setSelectedSourceAddress }) => {
  const socket = useContext(SocketContext);
  //const [selectedItem, setSelectedItem] = useState(null);
  //   const [selectedSA, setSelectedSA] = useState(-1);
  const [selectedItem, setSelectedItem] = useState(null);
  const handleSelect = (index) => {
    setSelectedItem(index);
    setSelectedSourceAddress(sourceAddresses[index].address);
    //setSelectedSA()
  };

  useEffect(() => {
    // Reset source addresses immediately
    setSourceAddresses([]);

    // Delay setup of socket listeners by 5 seconds
    const delaySetup = setTimeout(() => {
      // Listen for incoming CAN data from the server
      socket.on("can_data", (data) => {
        const addressData = {
          description: data.source_description, // Assuming your server sends this field
          address: data.source_address, // Assuming your server sends this field
          can_id: data.can_id,
          pgn: data.pgn,
          pgn_description: data.pgn_description,
          spns: data.spns,
          timestamp: data.timestamp,
        };

        // Only add unique addresses to the list and sort
        setSourceAddresses((prevAddresses) => {
          const isAddressPresent = prevAddresses.some((address) => address.address === addressData.address);
          if (!isAddressPresent) {
            const updatedAddresses = [...prevAddresses, addressData];
            return updatedAddresses.sort((a, b) => a.address - b.address);
          }
          return prevAddresses;
        });
      });
    }, 500); // 500 milliseconds = half seconds

    // Clean up event listeners and timeout on component unmount
    return () => {
      clearTimeout(delaySetup); // Clear timeout if component unmounts before delay ends
      socket.off("can_data");
    };
  }, [selectedInterface, setSourceAddresses, socket]);

  return (
    <div className="selectable-list">
      Source Addresses
      {sourceAddresses.map((address, index) => (
        <div key={index} className={`list-item ${selectedItem === index ? "selected" : ""}`} onClick={() => handleSelect(index)}>
          {address.address} : {address.description}
        </div>
      ))}
    </div>
  );
};

export default CANListener;
