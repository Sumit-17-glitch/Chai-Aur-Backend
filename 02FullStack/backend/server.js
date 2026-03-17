import express from 'express'

const app = express();

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send("Hello world module js");
})

app.get('/api/jokes', (req, res) => {
    const jokes = [
        {
            id: 1,
            title:"first joke",
            joke:"first joke laugh"
        },
        {
            id: 2,
            title:"second joke",
            joke:"second joke laugh"
        },
        {
            id: 3,
            title:"third joke",
            joke:"third joke laugh"
        }
    ]
    res.send(jokes);
})

app.listen(port, () => {
    console.log(`app is listning on port ${port}`);    
})
