/**
 * Culinaria - Menú Digital con Supabase
 * Programado por: Carlos Thomas Acosta
 */

// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
const SUPABASE_KEY = "TU_KEY_COMPLETA_AQUI"; // Pegá tu clave 'anon public'
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEFONO_WHATSAPP = "543751246552";
let carrito = [];
let esAdmin = false;

// 1. CARGAR PRODUCTOS (LECTURA)
async function cargarMenu() {
    const { data: productos, error } = await _supabase
        .from('Productos') // Asegurate que en Supabase empiece con Mayúscula
        .select('*')
        .order('nombre', { ascending: true });

    if (error) {
        console.error("Error cargando base de datos:", error);
        return;
    }

    const categorias = ['entradas', 'comidas', 'sin-alcohol', 'con-alcohol'];
    
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
                </div>
            `;
        });
    });
}

// 2. COMPRESIÓN Y SUBIDA (MODO ADMIN)
async function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value;
    const categoria = document.getElementById('add-categoria').value;
    const fotoOriginal = document.getElementById('add-imagen').files[0];

    if(!nombre || !precio || !fotoOriginal) return alert("Por favor, completa todos los campos y la imagen.");

    try {
        // Función interna para comprimir antes de subir
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

                        canvas.width = ancho;
                        canvas.height = alto;
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

        // Obtener URL y guardar en Tabla
        const { data: urlData } = _supabase.storage.from('imagenes-menu').getPublicUrl(nombreArchivo);
        
        const { error: dbError } = await _supabase.from('Productos').insert([
            { nombre, precio: parseInt(precio), categoria, imagen: urlData.publicUrl }
        ]);

        if (dbError) throw dbError;

        alert("¡Producto añadido!");
        location.reload();
    } catch (e) {
        alert("Error: " + e.message);
    }
}

// 3. GESTIÓN DE INTERFAZ ADMIN
function toggleAdmin() {
    const pin = prompt("PIN de Mantenimiento:");
    if (pin === "031223") { // Tu PIN actualizado
        esAdmin = true;
        document.getElementById('form-admin').style.display = 'block';
        document.getElementById('btn-admin-view').style.display = 'none';
        cargarMenu();
    } else {
        alert("PIN incorrecto");
    }
}

function cerrarAdmin() {
    esAdmin = false;
    document.getElementById('form-admin').style.display = 'none';
    document.getElementById('btn-admin-view').style.display = 'inline-block';
    cargarMenu();
}

async function eliminarProducto(id) {
    if (confirm("¿Estás seguro de eliminar este plato?")) {
        const { error } = await _supabase.from('Productos').delete().eq('id', id);
        if (error) alert("Error al eliminar");
        else cargarMenu();
    }
}

// 4. LÓGICA DE CARRITO Y WHATSAPP
function agregarAlCarrito(producto, precio) {
    carrito.push({ nombre: producto, precio: precio });
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const lista = document.getElementById('lista-carrito');
    const totalTxt = document.getElementById('total-precio');
    lista.innerHTML = "";
    let suma = 0;

    if (carrito.length === 0) {
        lista.innerHTML = '<p style="text-align: center; opacity: 0.5;">El carrito está vacío</p>';
    } else {
        carrito.forEach((item) => {
            suma += item.precio;
            lista.innerHTML += `
                <div class="item-carrito">
                    <span>${item.nombre}</span>
                    <span>$${item.precio}</span>
                </div>`;
        });
    }
    totalTxt.innerText = `$${suma}`;
}

function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if (carrito.length === 0) return alert("El carrito está vacío.");
    if (!mesa) return alert("Ingresá el número de mesa.");

    let detalle = "";
    carrito.forEach(item => detalle += `• ${item.nombre} ($${item.precio})\n`);

    const texto = encodeURIComponent(
        `*NUEVO PEDIDO - MESA ${mesa}*\n` +
        `----------------------------------\n` +
        detalle +
        `----------------------------------\n` +
        `*TOTAL: $${document.getElementById('total-precio').innerText.replace('$','') }*\n\n` +
        `_Enviado desde el Menú Digital_`
    );

    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${texto}`, '_blank');
}

// Inicialización
document.addEventListener('DOMContentLoaded', cargarMenu);
