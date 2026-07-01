// Testa o endpoint de stats com um token JWT válido
import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const token = jwt.sign({ id: 11, email: 'test@test.com' }, process.env.JWT_SECRET);

try {
    const res = await axios.post('http://localhost:3001/api/stats/atualizar/11', 
        { riot_id: 'smth like you#gigi' },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('SUCESSO:', JSON.stringify(res.data, null, 2));
} catch (err) {
    console.error('ERRO STATUS:', err.response?.status);
    console.error('ERRO BODY:', JSON.stringify(err.response?.data, null, 2));
    console.error('ERRO MSG:', err.message);
}
