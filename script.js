const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
// Asegurate de copiar la Key completa desde el panel de Supabase
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aHRyYnp2aW9kY2xpb3F0bWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQ2NTcsImV4cCI6MjA5MTQyMDY1N30.pROjzOh1pN52aDWDJCVWZ4TC6Nqu-cRidk_vAqckAxA"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEFONO_WHATSAPP = "543751246552";
let carrito = [];
let esAdmin = false;

// Muestra el nombre del archivo seleccionado de la galería
function actualizarNombreArchivo(input) {
    const display = document.getElementById('file-name-display');
    if (input.files && input.files[0]) {
        display.innerText = "Seleccionado: " + input.files[0].name;
    }
}

async function cargarMenu() {
    // IMPORTANTE: 'productos' en minúsculas para coincidir con tu base de datos
    const { data: productos, error } = await _supabase
        .from('productos') 
        .select('*')
        .order('nombre', { ascending: true });

    if (error) return console.error("Error al cargar:", error.message);

    const categorias = ['entradas', 'comidas', 'sin-alcohol', 'con-alcohol'];
    
    categorias.forEach(cat => {
        const divLista = document.querySelector(`#${cat} .lista`);
        if (!divLista) return;
        divLista.innerHTML = "";
        
        const filtrados = productos.filter(p => p.categoria === cat);

        filtrados.forEach(p => {
            let btnEliminar = esAdmin ? `<button onclick="eliminarProducto(${p.id})" style="background:none; border:1px solid #ff4444; color:#ff4444; padding:4px 8px; border-radius:4px; font-size:0.6rem; margin-top:5px; cursor:pointer;">BORRAR</button>` : "";

            divLista.innerHTML += `
                <div class="menu-item">
                    <img src="${p.imagen}" class="item-img" alt="${p.nombre}">
                    <div class="item-content">
                        <div class="item-info"><h3>${p.nombre}</h3><span class="price">$${p.precio}</span></div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                            ${btnEliminar}
                            <button class="btn-order" onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">AGREGAR</button>
                        </div>
                    </div>
                </div>`;
        });
    });
}

async function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value;
    const categoria = document.getElementById('add-categoria').value;
    const fotoArchivo = document.getElementById('add-imagen').files[0];

    if(!nombre || !precio || !fotoArchivo) return alert("Completa los datos e imagen.");

    try {
        // Nombre de archivo único basado en el tiempo
        const nombreArchivo = `${Date.now()}_${fotoArchivo.name}`;

        // Subida al Storage
        const { data: upData, error: upError } = await _supabase.storage
            .from('imagenes-menu')
            .upload(nombreArchivo, fotoArchivo);

        if (upError) throw upError;

        // Obtener la URL pública de la imagen
        const { data: urlData } = _supabase.storage.from('imagenes-menu').getPublicUrl(nombreArchivo);

        // Insertar en la tabla 'productos' (en minúsculas)
        const { error: dbError } = await _supabase.from('productos').insert([{ 
            nombre, 
            precio: parseInt(precio), 
            categoria, 
            imagen: urlData.publicUrl 
        }]);

        if (dbError) throw dbError;
        alert("¡Producto subido correctamente!");
        location.reload();
    } catch (err) { 
        alert("Error de subida: " + err.message); 
    }
}

function toggleAdmin() {
    const pin = prompt("PIN:");
    if (pin === "031223") {
        esAdmin = true;
        document.getElementById('form-admin').style.display = 'block';
        cargarMenu();
    }
}

function cerrarAdmin() {
    esAdmin = false;
    document.getElementById('form-admin').style.display = 'none';
    cargarMenu();
}

async function eliminarProducto(id) {
    if (confirm("¿Seguro que quieres borrar este producto?")) {
        // Corregido a minúsculas
        const { error } = await _supabase.from('productos').delete().eq('id', id);
        if (error) alert("Error al borrar: " + error.message);
        cargarMenu();
    }
}

function agregarAlCarrito(prod, prec) {
    carrito.push({ nombre: prod, precio: prec });
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const lista = document.getElementById('lista-carrito');
    const totalTxt = document.getElementById('total-precio');
    lista.innerHTML = "";
    let suma = 0;
    carrito.forEach(item => {
        suma += item.precio;
        lista.innerHTML += `<div class="item-carrito"><span>${item.nombre}</span><span>$${item.precio}</span></div>`;
    });
    totalTxt.innerText = `$${suma}`;
}

function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if (carrito.length === 0 || !mesa) return alert("Falta el pedido o el número de mesa.");
    let detalle = "";
    carrito.forEach(item => detalle += `• ${item.nombre} ($${item.precio})\n`);
    const texto = encodeURIComponent(`*PEDIDO MESA ${mesa}*\n${detalle}*TOTAL: $${document.getElementById('total-precio').innerText}*`);
    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${texto}`, '_blank');
}

document.addEventListener('DOMContentLoaded', cargarMenu);
