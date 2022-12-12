import express from 'express';
import { body } from 'express-validator';
import { 
    admin, 
    crear, 
    guardar, 
    agregarImagen, 
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    cambiarEstado,
    mostrarPropiedad,
    enviarMensaje,
    verMensajes
} from '../controllers/propiedadController.js';
import protegerRuta from '../middleware/protegerRuta.js';
import upload from '../middleware/subirImagen.js';
import identificarUsuario from "../middleware/identificarUsuraio.js";

const router = express.Router();

router.get('/mis-propiedades', protegerRuta,  admin);
router.get('/propiedades/crear', protegerRuta, crear);
router.post('/propiedades/crear',
    protegerRuta,
    body('titulo').notEmpty().withMessage('El Titulo del Anuncio es Obligatorio'),
    body('descripcion')
        .notEmpty().withMessage('La Descripción no puede ir vacia')
        .isLength({ max: 200 }).withMessage('La Descripción es muy larga'),
    body('categoria').isNumeric().withMessage('Seleccióna una categoria'),
    body('precio').isNumeric().withMessage('Seleccióna un rango de Precios'),
    body('habitaciones').isNumeric().withMessage('Seleccióna la Cantidad de habitaciones'),
    body('estacionamiento').isNumeric().withMessage('Seleccióna la Cantidad de estacionamientos'),
    body('wc').isNumeric().withMessage('Seleccióna la Cantidad de baños'),
    body('lat').notEmpty().withMessage('Ubica la Propiedad en el Mapa'),
    guardar
);

router.get('/propiedades/agregar-imagen/:id', protegerRuta, agregarImagen);

router.post('/propiedades/agregar-imagen/:id', 
    protegerRuta, 
    upload.single('imagen'),
    almacenarImagen 
);

router.get('/propiedades/editar/:id', 
    protegerRuta,
    editar
)

router.post('/propiedades/editar/:id',
    protegerRuta,
    body('titulo').notEmpty().withMessage('El Titulo del Anuncio es Obligatorio'),
    body('descripcion')
        .notEmpty().withMessage('La Descripción no puede ir vacia')
        .isLength({ max: 200 }).withMessage('La Descripción es muy larga'),
    body('categoria').isNumeric().withMessage('Seleccióna una categoria'),
    body('precio').isNumeric().withMessage('Seleccióna un rango de Precios'),
    body('habitaciones').isNumeric().withMessage('Seleccióna la Cantidad de habitaciones'),
    body('estacionamiento').isNumeric().withMessage('Seleccióna la Cantidad de estacionamientos'),
    body('wc').isNumeric().withMessage('Seleccióna la Cantidad de baños'),
    body('lat').notEmpty().withMessage('Ubica la Propiedad en el Mapa'),
    guardarCambios
);

router.post('/propiedades/eliminar/:id', 
    protegerRuta,
    eliminar
);

router.put('/propiedades/:id', 
    protegerRuta,
    cambiarEstado
)

// Area Pública
router.get('/propiedad/:id',
    identificarUsuario,
    mostrarPropiedad
);

// Almacenar los mensajes
router.post('/propiedad/:id',
    identificarUsuario,
    body('mensaje').isLength({min: 10}).withMessage('El mensaje no puede ir vacio o es muy corto'),
    enviarMensaje
);

router.get('/mensajes/:id', 
    protegerRuta,
    verMensajes
)

export default router;