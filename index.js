const cron = require('node-cron');

// Esta tarea se ejecutará todos los días a las 16:15
cron.schedule('30 23 * * *', async function() {
    console.log('Actualizando horarios a "Libre"...');

    // Aquí va el código para actualizar todos los horarios del día actual en la base de datos de Notion
    const currentDate = new Date();
    const currentDay = currentDate.getDay();
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const today = days[currentDay];

    const results = await notion.databases.query({
        database_id: "faac3196fb5d4c5daa0bf944180604fb",
    });

    for (const item of results.results) {
        const pageId = item.id;
        await notion.pages.update({
            page_id: pageId,
            properties: {
                [today]: {
                    checkbox: false
                }
            }
        });
    }

    // Actualizar la variable currentData con la información más reciente de Notion
    getNotionData();

    console.log('Horarios del día actual actualizados a "Libre"');
});


const express = require('express');
const path = require('path');
const { Client } = require('@notionhq/client');

const app = express();
const PORT = 3000;

let currentData = {};  // Variable para almacenar los datos de Notion

// Inicialización del cliente de Notion
const notion = new Client({
    auth: "secret_5ExxvA5moDPSDA381d9VxqnlXIKtvG5Jba7nELqdLgE",
});

// Middleware para parsear el cuerpo de las solicitudes POST en formato JSON
app.use(express.json());

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/data', (req, res) => {
    res.json(currentData);
});

app.post('/updateStatus', async (req, res) => {
    const { day, horario, newState } = req.body;

    // Encuentra el ID del elemento en la base de datos de Notion basado en el horario
    const itemToUpdate = currentData.results.find(item => item.properties.Horario.title[0].text.content === horario);

    if (itemToUpdate) {
        const pageId = itemToUpdate.id;

        // Actualiza la base de datos de Notion
        await notion.pages.update({
            page_id: pageId,
            properties: {
                [day]: {
                    checkbox: newState
                }
            }
        });

        // Actualiza la variable con los datos más recientes
        itemToUpdate.properties[day].checkbox = newState;
    }

    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

async function getNotionData() {
    const results = await notion.databases.query({
        database_id: "faac3196fb5d4c5daa0bf944180604fb",
    });
    currentData = results;
}

getNotionData();

setInterval(getNotionData, 60000);  // Actualizará currentData cada minuto


app.use((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
});

setInterval(async () => {
    await getNotionData();  // Actualiza currentData cada cierto tiempo (por ejemplo, cada minuto)
}, 60000);
