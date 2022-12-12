import { check, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import Usuario from "../models/Usuario.js";
import { generarId, generarJWT } from '../helpers/tokens.js';
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js';

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken()
    });
}

const autenticar = async (req, res) => {
    // Validación
    await check('email').isEmail().withMessage('El Email es Obligatorio').run(req);
    await check('password').notEmpty().withMessage('El password es Obligatorio'). run(req);

    let resultado = validationResult(req);

    // Verificar que el resultado este vacio
    if(!resultado.isEmpty()) {
        // Errores
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        });
    }

    const { email, password } = req.body;
    
    // Comprobar si el resultado existe
    const usuario = await Usuario.findOne({ where: {email} });
    if(!usuario) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El Usuario No Existe'}]
        });
    }

    // Comprobar si el usuario esta confirmado
    if(!usuario.confirmado) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'Tu Cuenta no ha sido confirada' }]
        });
    }

    // Revisar el password
    if(!usuario.verificarPassword(password)) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El Password es Incorrecto' }]
        });
    }

    // Autenticar al ususario
    
    const token = generarJWT({ id: usuario.id, nombre: usuario.nombre });

    console.log(token);

    // Almacenar en un Cookie

    return res.cookie('_token', token, {
        httpOnly: true
        // secure: true -> recomendable solo si se tiene ssl en el servidor
    }).redirect('/mis-propiedades');

}

const cerrarSesion = async (req, res) => {
    
    return res.clearCookie('_token').status(200).redirect('/auth/login');
}

const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
        pagina: 'Crear Cuenta',
        csrfToken: req.csrfToken()
    });
}

const registrar = async (req, res) => {
    // Validación
    await check('nombre').notEmpty().withMessage('El nombre no puede ir vacio').run(req);
    await check('email').isEmail().withMessage('Eso no parece un email').run(req);
    await check('password').isLength({min: 6}).withMessage('El password debe ser de al menos 6 caracteres'). run(req);
    await check('repetir_password').equals('password').withMessage('Los passwords no son iguales'). run(req);

    let resultado = validationResult(req);

    // Verificar que el resultado este vacio
    if(!resultado.isEmpty()) {
        // Errores
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        });
    }

    // Extraer los datos
    const { nombre, email, password } = req.body;

    // Verificar que el usuario no este duplicado
    const existeUsuario = await Usuario.findOne({where: { email }});
    if(existeUsuario) {
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El Usuario ya esta Registrado'}],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        });
    }

    // Almacenar un usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    });

    // Envia email de confirmación
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    // Mostrar mensaje de confirmación
    res.render('templates/mensaje', {
        pagina: 'Cuenta Creada Correctamente',
        mensaje: 'Hemos Enviado un Email de Confirmación, presiona en el enlace'
    })

}

// Funcrión que comprueba una cuenta
const confirmar = async (req, res) => {
    
    const { token } = req.params;

    console.log( token );

    // Verificar si el token es valido
    const usuario = await Usuario.findOne({where: {token}});

    if(!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
            error: true
        });
    }

    // Confirmar la cuenta
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Cuenta Confirmada',
        mensaje: 'La cuenta se confirmó correctamente'
    });

    console.log(usuario);

}

const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
        pagina: 'Recupera tu acceso a Bienes Raices',
        csrfToken: req.csrfToken()
    });
}

const resetPassword = async (req, res) => {
    // Validación
    await check('email').isEmail().withMessage('Eso no parece un email').run(req);

    let resultado = validationResult(req);

    // Verificar que el resultado este vacio
    if(!resultado.isEmpty()) {
        // Errores
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        });
    }

    // Buscar el usuario
    const { email } = req.body;

    const usuario = await Usuario.findOne({ where: {email} });
    if(!usuario) {
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El Email no Pertenece a ningún usuario'}]
        });
    }

    // Generar un token y enviar el eamil
    usuario.token = generarId();
    await usuario.save();

    // Enviar Email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })

    // Renderizar un mensaje
    res.render('templates/mensaje', {
        pagina: 'Reestablece tun Passsword',
        mensaje: 'Hemos Enviado un Email con las instrucciones'
    })
}

const comprobarToken = async (req, res) => {

    const { token } = req.params;

    const usuario = await Usuario.findOne({ where: {token} });
    if(!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Reestablece tu Password',
            mensaje: 'Hubo un error al validar tu información',
            error: true
        });
    }

    // Mostrar formulario para modificar el password
    res.render('auth/reset-password', {
        pagina: 'Reestablece Tu Password Aqui',
        csrfToken: req.csrfToken()
    })

}

const nuevoPassword = async (req, res) => {
    // Validar el password
    await check('password').isLength({min: 6}).withMessage('El password debe ser de al menos 6 caracteres').run(req);
    let resultado = validationResult(req);

    // Verificar que el resultado este vacio
    if(!resultado.isEmpty()) {
        // Errores
        return res.render('auth/reset-password', {
            pagina: 'Reestablece tu Password',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        });
    }

    const { token } = req.params;
    const { password } = req.body;
    
    // Identificar quien hace el cambio
    const usuario = await Usuario.findOne({ where: {token} });

    // Hashear el nuevo password
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
    usuario.token = null;

    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Password Reestablecido',
        mensaje: 'El Password se guardo correctamente'
    })
}

export {
    formularioLogin,
    autenticar,
    cerrarSesion,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}