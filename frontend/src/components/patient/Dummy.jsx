import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState } from 'react';

export default function Dummy() {
  const navigate = useNavigate();

  const handlePDFView = async (event) => {
    console.log("lol")

    try {
      console.log("hi")
      const response = await axios.get(`/en/pdfid/6687c7725a4889e9aac64ec2`, { responseType: 'arraybuffer' });

      const binaryData = new Uint8Array(response.data);

      const blob = new Blob([binaryData], { type: 'application/pdf' });
      let url = window.URL.createObjectURL(blob);
      navigate(`/pdfShow`, { state: { url: url } })


      //setPdfURL(url)

    } catch (error) {
      console.log("Error uploading details:", error);
      alert('File size too large');
    }
  }

  return (
    <button onClick={handlePDFView}> 
      show pdf
    </button>
  );
}