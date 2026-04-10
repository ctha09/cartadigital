const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_8rn7tgMAtO37eu7RfkIIyA_Sl0VAqlm"; // Asegúrate de que sea la sb_publishable...
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEFONO_WHATSAPP = "543751246552";
let carrito = [];
let esAdmin = false;

async function cargarMenu() {
    const { data: productos, error } = await _supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });

    if (error) return console.error("Error:", error);

    const categorias = ['entradas', 'comidas', 'sin-alcohol', 'con-alcohol'];
    
    categorias.forEach(cat => {
        const divLista = document.querySelector(`#${cat} .lista`);
        if (!divLista) return;
        divLista.innerHTML = ""; 
        
        const filtrados = productos.filter(p => p.categoria === cat);

        filtrados.forEach(p => {
            let controlesAdmin = esAdmin ? `
                <div class="admin-actions">
                    <button onclick="editarPrecio(${p.id}, ${p.precio})">✎</button>
                    <button onclick="eliminarProducto(${p.id})" class="btn-del">🗑</button>
                </div>` : "";

            divLista.innerHTML += `
                <div class="menu-item">
                    <img src="${p.imagen}" class="item-img" alt="${p.nombre}">
                    <div class="item-content">
                        <h3>${p.nombre}</h3>
                        <p class="price">$${p.precio}</p>
                        ${controlesAdmin}
                        <button class="btn-order" onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">AGREGAR</button>
                    </div>
                </div>`;
        });
    });
}

function toggleAdmin() {
    if (!esAdmin) {
        const pin = prompt("PIN de Seguridad:");
        if (pin === "031223") {
            esAdmin = true;
            document.getElementById('form-nuevo-producto').style.display = 'block';
            document.getElementById('btn-admin-toggle').innerText = "CERRAR EDITOR";
            cargarMenu();
        } else { alert("PIN Incorrecto"); }
    } else {
        esAdmin = false;
        document.getElementById('form-nuevo-producto').style.display = 'none';
        document.getElementById('btn-admin-toggle').innerText = "MODO ADMIN";
        cargarMenu();
    }
}

async function guardarNuevoProducto() {
    const btn = document.getElementById('btn-publicar');
    const status = document.getElementById('upload-status');
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value;
    const categoria = document.getElementById('add-categoria').value;
    const fotoArchivo = document.getElementById('add-imagen').files[0];

    if(!nombre || !precio || !fotoArchivo) return alert("Faltan datos o la foto.");

    // Bloquear botón para evitar duplicados
    btn.disabled = true;
    status.style.display = "block";

    try {
        const nombreArchivo = `${Date.now()}_${fotoArchivo.name.replace(/\s/g, '_')}`;
        const { data: uploadData, error: uploadError } = await _supabase.storage
            .from('imagenes-menu')
            .upload(nombreArchivo, fotoArchivo);

        if (uploadError) throw uploadError;

        const { data: urlData } = _supabase.storage
            .from('imagenes-menu')
            .getPublicUrl(nombreArchivo);

        const { error: dbError } = await _supabase
            .from('productos')
            .insert([{ nombre, precio: parseInt(precio), categoria, imagen: urlData.publicUrl }]);

        if (dbError) throw dbError;

        alert("¡Publicado!");
        location.reload();
    } catch (err) {
        alert("Error: " + err.message);
        btn.disabled = false;
        status.style.display = "none";
    }
}

// FUNCIONES DE CARRITO
function agregarAlCarrito(nombre, precio) {
    carrito.push({ nombre, precio });
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const lista = document.getElementById('lista-carrito');
    const totalTxt = document.getElementById('total-precio');
    lista.innerHTML = "";
    let suma = 0;
    carrito.forEach((item, index) => {
        suma += item.precio;
        lista.innerHTML += `<div class="item-carrito">${item.nombre} - $${item.precio} <span onclick="quitar(${index})">✕</span></div>`;
    });
    totalTxt.innerText = `$${suma}`;
}

function quitar(index) {
    carrito.splice(index, 1);
    actualizarVistaCarrito();
}

function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if (!mesa || carrito.length === 0) return alert("Completa el pedido y la mesa.");
    let msg = `*PEDIDO MESA ${mesa}*\n`;
    carrito.forEach(i => msg += `- ${i.nombre}\n`);
    msg += `*TOTAL: ${document.getElementById('total-precio').innerText}*`;
    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${encodeURIComponent(msg)}`);
}

document.addEventListener('DOMContentLoaded', cargarMenu);
