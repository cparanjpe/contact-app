const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const csv = require('csv-parser');
const fs = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const uri = 'mongodb+srv://cparanjpe2003:abcd123@cluster0.mb5lk9l.mongodb.net/contactlist?retryWrites=true&w=majority'
// const multer = require('multer');
// const csvWriter = require('csv-write-stream');
// const fs = require('fs');
const ejs = require('ejs');
const Contact = require('./models/contactModel.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));


async function connect(){
    try{
        await mongoose.connect(uri)
        console.log("Connected to MongoDB")
    }catch(err){
        console.error("Error connecting :",err)
    }
}
connect();

app.get("/",function(req,res){
    res.sendFile(__dirname+"/home.html");
});

app.get("/contact",function(req,res){
    res.sendFile(__dirname+"/contact.html");
});

app.post('/contact', async(req, res) => {
    console.log(req.body.fname, req.body.phno);
    const fname = req.body.fname;
    const phno = req.body.phno;
    const contact = new Contact({name: fname,numbers: phno});
    try {
        const savedContact = await contact.save();
        // res.status(201).json(savedContact);
        res.redirect("/")
      } catch (err) {
        if (err.code === 11000) {
          res.status(400).json({ error: 'Duplicate phone numbers are not allowed.' });
        } else {
            console.log(err)
          res.status(500).json({ error: 'An error occurred while creating the contact.' });
        }
      }

    //  res.redirect("/");
});


app.post('/updateContact/:id', async(req,res) =>{
    
    const { id } = req.params;
    const name  = req.body.fname;
    const phno = req.body.phno;
    try {
        const updatedContact = await Contact.findByIdAndUpdate(id, {name: name, numbers: phno }, { new: true });
    
        if (!updatedContact) {
          return res.status(404).json({ error: 'Contact not found.' });
        }
    
        res.redirect("/")
      } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ error: 'Duplicate phone numbers are not allowed.' });
          } 
        res.status(500).json({ error: 'An error occurred while updating the contact.' });
    }

});
// Fetch all contacts
app.get('/allcontacts', async (req, res) => {
  try {
    const contacts = await Contact.find({});
    res.render('allcontacts', { contacts });
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while fetching contacts.' });
  }
});

app.get('/updateContact/:id',async (req, res) => {
    const { id } = req.params;
    try {
        const contacts = await Contact.findById(id);
        res.render('updatecontact', { contacts });
      } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'An error occurred while fetching contacts.' });
      }
});
// Delete a contact by ID
app.delete('/contacts/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const deletedContact = await Contact.findByIdAndDelete(id);
  
      if (!deletedContact) {
        return res.status(404).json({ error: 'Contact not found.' });
      }
  
      res.json({ message: 'Contact deleted successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'An error occurred while deleting the contact.' });
    }
});

app.get("/search", (req,res) =>{   
        res.render('search');   

})
app.post("/search",async(req,res)=>{
    const q = req.body.searchQuery;
    try {
        const contacts = await Contact.find({
          $or: [
            { name: { $regex: q, $options: 'i' } }, // Case-insensitive search by name
            { phoneNumbers: { $regex: q, $options: 'i' } } // Case-insensitive search by phone number
          ]
        });
        res.render("searched-contacts",{contacts})
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while searching for contacts.' });
      }
})
  

app.get('/contacts/export/csv', async (req, res) => {
    try {
      const contacts = await Contact.find(); // Fetch all contacts from the database
  
      // Define the CSV header and rows
      const csvHeader = ['Name', 'Phone Numbers'];
      const csvRows = contacts.map(contact => [contact.name, contact.numbers.join(', ')]);
  
      // Create a writable stream to store the CSV data
      const csvData = [];
  
      // Push the header and rows to the CSV data
      csvData.push(csvHeader);
      csvData.push(...csvRows);
    //   console.log(csvData);
  
      // Create a writable stream to write the CSV data
      const writeStream = fs.createWriteStream('contacts.csv');
  
      // Write the CSV data to the writable stream
      csvData.forEach(row => {
        writeStream.write(row.join(',') + '\n');
      });
  
      writeStream.end(); // Close the writable stream
  
      // Set the response headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
  
      // Create a readable stream to read the CSV file
      const readStream = fs.createReadStream('contacts.csv');
  
      // Use the pipeline function to send the file data in the response
      const pipelineAsync = promisify(pipeline);
      await pipelineAsync(readStream, res);
  
      // Delete the CSV file after sending it
      fs.unlinkSync('contacts.csv');
    } catch (err) {
        console.log(err)
      res.status(500).json({ error: 'An error occurred while exporting contacts to CSV.' });
    }
});

app.get("/addMoreNumbers/:id",async(req,res)=>{
    const { id } = req.params;
    try {
        const contacts = await Contact.findById(id);
        res.render('addcontact', { contacts });
      } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'An error occurred while fetching contacts.' });
      }

});

app.post("/addMoreNumbers/:id",async(req,res)=>{
    const { id } = req.params;
    try {
        const contacts = await Contact.findById(id);
        const name = contacts.name;
        const prevNo = contacts.numbers;
        prevNo.push(req.body.newNumber);
        
        const updatedContact = await Contact.findByIdAndUpdate(id, {name: name, numbers: prevNo }, { new: true });
    
        if (!updatedContact) {
          return res.status(404).json({ error: 'Contact not found.' });
        }
        // res.json(updatedContact);
        res.redirect("/allcontacts");

      } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'An error occurred while fetching contacts.' });
      }

    
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

