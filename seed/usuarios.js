import bcrypt from 'bcrypt';

const usuarios = [
    {
        nombre: 'Aldair',
        email: 'aldair@aldair.com',
        confirmado: 1,
        password: bcrypt.hashSync('password', 10)
    }
]

export default usuarios;