/**
 * Culinaria - Menú Digital
 * Programado por: Carlos Thomas Acosta
 */

// 1. CONFIGURACIÓN DE CONEXIÓN
const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
const SUPABASE_KEY = "TU_KEY_ANON_AQUI"; // Pegá tu clave 'anon public' aquí
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEFONO_WHATSAPP = "543751246552";
let carrito = [];
let esAdmin = false;

// 2. CARGAR MENÚ (CORREGIDO: tabla 'productos' en minúsculas)
async function cargarMenu() {
    const { data: productos, error } = await _supabase
        .from('productos') // Cambiado a minúsculas según el error de tu captura
        .select('*')
        .order('nombre', { ascending: true });

    if (error) {
        console.error("Error de Supabase:", error.message);
        return;
    }

    const categorias = ['entradas', 'comidas', 'bebidas']; // Ajustado a tus nuevas categorías
    
    categorias.forEach(cat => {
        const contenedor = document.querySelector(`#${cat} .lista`);
        if (!contenedor) return;
        contenedor.innerHTML = "";
        
        const filtrados = productos.filter(p => p.categoria === cat);

        filtrados.forEach(p => {
            let btnEliminar = esAdmin ? `<button onclick="eliminarProducto(${p.id})" style="background:none; border:1px solid #ff4444; color:#ff4444; padding:4px 8px; border-radius:4px; font-size:0.6rem; margin-top:5px; cursor:pointer;">BORRAR</button>` : "";
            
            contenedor.innerHTML += `
                <div class="menu-item">
                    <img src="${p.imagen}" class="item-img" alt="${p.nombre}" loading="lazy">
                    <div class="item-content">
                        <div class="item-info">
                            <h3>${p.nombre}</h3>
                            <span class="price">$${p.precio}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                            ${btnEliminar}
                            <button class="btn-order" onpointerdown="agregarAlCarrito('${p.nombre}', ${p.precio})">AGREGAR</button>
                        </div>
                    </div>
                </div>`;
        });
    });
}

// 3. SUBIDA CON COMPRESIÓN AUTOMÁTICA
async function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value;
    const categoria = document.getElementById('add-categoria').value;
    const fotoOriginal = document.getElementById('add-imagen').files[0];

    if(!nombre || !precio || !fotoOriginal) return alert("Completa todos los campos.");

    try {
        // Optimización de imagen para ahorrar espacio en Supabase
        const optimizarImagen = (archivo) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(archivo);
                reader.onload = (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_ANCHO = 1080;
                        let ancho = img.width;
                        let alto = img.height;
                        if (ancho > MAX_ANCHO) {
                            alto *= MAX_ANCHO / ancho;
                            ancho = MAX_ANCHO;
                        }
                        canvas.width = ancho; canvas.height = alto;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, ancho, alto);
                        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
                    };
                };
            });
        };

        const archivoListo = await optimizarImagen(fotoOriginal);
        const nombreArchivo = `${Date.now()}_plato.jpg`;

        // Subida al Storage
        const { error: upError } = await _supabase.storage
            .from('imagenes-menu')
            .upload(nombreArchivo, archivoListo, { contentType: 'image/jpeg' });

        if (upError) throw upError;

        const { data: urlData } = _supabase.storage.from('imagenes-menu').getPublicUrl(nombreArchivo);
        
        // Insertar en tabla 'productos'
        const { error: dbError } = await _supabase.from('productos').insert([
            { nombre, precio: parseInt(precio), categoria, imagen: urlData.publicUrl }
        ]);

        if (dbError) throw dbError;
        alert("¡Plato subido con éxito!");
        location.reload();
    } catch (e) {
        alert("Error crítico: " + e.message);
    }
}

// 4. FUNCIONES DE ADMIN Y CARRITO
function toggleAdmin() {
    const pin = prompt("PIN de Mantenimiento:");
    if (pin === "031223") {
        esAdmin = true;
        document.getElementById('form-admin').style.display = 'block';
        cargarMenu();
    } else {
        alert("PIN Incorrecto");
    }
}

async function eliminarProducto(id) {
    if (confirm("¿Borrar plato?")) {
        await _supabase.from('productos').delete().eq('id', id);
        cargarMenu();
    }
}

function agregarAlCarrito(producto, precio) {
    carrito.push({ nombre: producto, precio: precio });
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const lista = document.getElementById('lista-carrito');
    const totalTxt = document.getElementById('total-precio');
    lista.innerHTML = "";
    let suma = 0;
    carrito.forEach((item) => {
        suma += item.precio;
        lista.innerHTML += `<div class="item-carrito"><span>${item.nombre}</span><span>$${item.precio}</span></div>`;
    });
    totalTxt.innerText = `$${suma}`;
}

function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if (carrito.length === 0 || !mesa) return alert("Falta el pedido o la mesa.");
    let detalle = "";
    carrito.forEach(item => detalle += `• ${item.nombre} ($${item.precio})\n`);
    const texto = encodeURIComponent(`*PEDIDO MESA ${mesa}*\n${detalle}*TOTAL: $${document.getElementById('total-precio').innerText}*`);
    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${texto}`, '_blank');
}

document.addEventListener('DOMContentLoaded', cargarMenu);
