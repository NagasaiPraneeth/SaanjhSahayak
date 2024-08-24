const { MongoClient, ObjectId, GridFSBucket } = require('mongodb');
const Pdf = require('pdf-parse');
const multer = require('multer');
const express = require('express');
const app = express();
const axios = require('axios');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const { analysis } = require('./LLM');
const mongoURI = "mongodb+srv://Project:Florencemidhebaramvesam@project.tbx2krn.mongodb.net/Saanjh";
const databaseName = 'Saanjh';
const client = new MongoClient(mongoURI);
let db;
client.connect();
db = client.db(databaseName);
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadpdf = async (req, res) => {
    try {
        if (!db) {
            throw new Error('MongoDB connection not established.');
        }
        const { file, filename, patientId, name ,base64File} = req.body;

        const uploadFile = async (data, name,base64File) => {
            const buffer = Buffer.from(data, 'base64');
            const mimeType = data.contentType;
            const bucket = new GridFSBucket(db);
            const uploadStream = bucket.openUploadStream(name);
            const fileId = uploadStream.id;
            const fileData = Buffer.from(base64File.split(',')[1], 'base64');
            
            const contentType = base64File.split(';')[0].split(':')[1];


            let parsed;

            await Pdf(buffer).then(function (data) {
                parsed = (data.text);
            })
            console.log("parsed text size is ", Buffer.from(parsed).length);

            try {
                if(Buffer.from(parsed).length>100){
                    const response = await axios.post('http://localhost:5173/en/getparameters', { text: parsed });
                console.log(response.data);


                const jsonObject = response.data.data;
                await new Promise((resolve, reject) => {
                    uploadStream.end(buffer, (error) => {
                        if (error) {
                            console.error(`Error uploading ${name}:`, error);
                            reject(error);
                        } else {
                            console.log(`${name} uploaded successfully, stored under id:`, fileId);
                            resolve(fileId);
                        }
                    });
                });
                return { fileId, jsonObject };
                }
                else{
                //unable to parse the pdf
                
                const response = await axios.post('http://localhost:5173/en/getparametersImage', { fileData: fileData.toString('base64'), contentType: contentType });
                const jsonObject = JSON.parse(response.data.parameters);
                const len=Object.keys(jsonObject).length;
                if(len>5){
                    await new Promise((resolve, reject) => {
                        uploadStream.end(buffer, (error) => {
                            if (error) {
                                console.error(`Error uploading ${name}:`, error);
                                reject(error);
                            } else {
                                console.log(`${name} uploaded successfully, stored under id:`, fileId);
                                resolve(fileId);
                            }
                        });
                    });
                    return { fileId, jsonObject };
                }
                return { fileId: null, jsonObject: null }
                }
                
            } catch (error) {
                return { fileId: null, jsonObject: null }

            }

           
        };
        const fileDetails = file ? await uploadFile(file, filename,base64File) : null;
        if (fileDetails.fileId === null) {
            return res.json({ data: false });
        }
        const fileId = fileDetails.fileId;
        const jsonObject = fileDetails.jsonObject;

        console.log("hi");
        const analysis_response = await axios.post('https://saanjh-sahayak-backend.vercel.app/en/analysis', { fileId: fileId, jsonObject: jsonObject, patientId: patientId, name: name });
        console.log("analysis_response ", analysis_response.data.data)
        return res.json({ data: true });


    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save pdf details' });
    }
}

const pdfid = async (req, res) => {
    try {
        const conn = mongoose.createConnection("mongodb+srv://Project:Florencemidhebaramvesam@project.tbx2krn.mongodb.net/Saanjh");
        let gfs;
        conn.once('open', () => {
            gfs = new mongoose.mongo.GridFSBucket(conn.db, {
                bucketName: 'fs'
            });
        });



        const fileId = new mongoose.Types.ObjectId(req.params.id);

        if (!gfs) {
            conn.once('open', () => {
                gfs = new mongoose.mongo.GridFSBucket(conn.db, {
                    bucketName: 'fs'
                });
                const readStream = gfs.openDownloadStream(fileId);
                res.set('Content-Type', 'application/pdf');
                readStream.pipe(res);
            });
        } else {
            gfs.openDownloadStream(fileId).pipe(res);
        }


    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal server error');
    }
};

const pdfparse = async (req, res) => {
    try {
        const { file } = req.body;
        const buffer = Buffer.from(data, 'base64');

    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send('Error processing file');
    }
};

const reciver = async (req, res) => {
    const parsed = req.body.text;
}



module.exports = { uploadpdf, pdfid, pdfparse, reciver, analysis }