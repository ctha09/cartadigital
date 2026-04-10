// CONFIGURACIÓN DE CONEXIÓN
const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_8rn7tgMAt037eu7RfkIIyA_S10VA..."; // Pegá tu Key aquí
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEFONO_WHATSAPP = "543751246552";
let carrito = [];
let esAdmin = false;

// 1. CARGAR MENÚ
async function cargarMenu() {
    const { data: productos, error } = await _supabase
        .from('Productos')
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
                    <button onclick="editarPrecio(${p.id}, ${p.precio})">✎ Precio</button>
                    <button onclick="eliminarProducto(${p.id})" class="btn-del">🗑 Borrar</button>
                </div>` : "";

            divLista.innerHTML += `
                <div class="menu-item">
                    <img src="${p.imagen}" class="item-img" alt="${p.nombre}">
                    <div class="item-content">
                        <div class="item-info"><h3>${p.nombre}</h3><span class="price">$${p.precio}</span></div>
                        ${controlesAdmin}
                        <button class="btn-order" onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">AGREGAR</button>
                    </div>
                </div>`;
        });
    });
}

// 2. MODO ADMINISTRADOR
function toggleAdmin() {
    if (!esAdmin) {
        const pin = prompt("PIN de Seguridad:");
        if (pin === "031223") {
            esAdmin = true;
            document.getElementById('form-nuevo-producto').style.display = 'block';
            document.getElementById('btn-admin-toggle').innerText = "SALIR MODO EDITOR";
            cargarMenu();
        } else { alert("PIN Incorrecto"); }
    } else {
        esAdmin = false;
        document.getElementById('form-nuevo-producto').style.display = 'none';
        document.getElementById('btn-admin-toggle').innerText = "MODO ADMIN";
        cargarMenu();
    }
}

// SUBIR IMAGEN Y GUARDAR PRODUCTO
async function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value;
    const categoria = document.getElementById('add-categoria').value;
    const fotoArchivo = document.getElementById('add-imagen').files[0];

    if(!nombre || !precio || !fotoArchivo) {
        return alert("Completa nombre, precio y elige una foto de la galería.");
    }

    try {
        const nombreArchivo = `${Date.now()}_${fotoArchivo.name}`;
        const { data: uploadData, error: uploadError } = await _supabase.storage
            .from('imagenes-menu')
            .upload(nombreArchivo, fotoArchivo);

        if (uploadError) throw uploadError;

        const { data: urlData } = _supabase.storage
            .from('imagenes-menu')
            .getPublicUrl(nombreArchivo);

        const { error: dbError } = await _supabase
            .from('Productos')
            .insert([{ 
                nombre: nombre, 
                precio: parseInt(precio), 
                categoria: categoria, 
                imagen: urlData.publicUrl 
            }]);

        if (dbError) throw dbError;

        alert("¡Producto publicado!");
        location.reload();
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// 3. EDITAR Y ELIMINAR (Tus funciones originales)
async function editarPrecio(id, precioActual) {
    const nuevo = prompt("Nuevo precio:", precioActual);
    if (nuevo) {
        await _supabase.from('Productos').update({ precio: parseInt(nuevo) }).eq('id', id);
        cargarMenu();
    }
}

async function eliminarProducto(id) {
    if (confirm("¿Eliminar este plato?")) {
        await _supabase.from('Productos').delete().eq('id', id);
        cargarMenu();
    }
}

// 4. CARRITO (Tu lógica original)
function agregarAlCarrito(producto, precio) {
    carrito.push({ nombre: producto, precio: precio });
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const lista = document.getElementById('lista-carrito');
    const totalTxt = document.getElementById('total-precio');
    lista.innerHTML = "";
    let suma = 0;
    
    carrito.forEach((item, index) => {
        suma += item.precio;
        lista.innerHTML += `<div class="item-carrito">
            <span>${item.nombre}</span>
            <span>$${item.precio} <button onclick="quitarDelCarrito(${index})">✕</button></span>
        </div>`;
    });
    totalTxt.innerText = `$${suma}`;
}

function quitarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarVistaCarrito();
}

function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if (carrito.length === 0 || !mesa) return alert("Agrega productos e indica la mesa.");
    let detalle = "";
    carrito.forEach(item => detalle += `• ${item.nombre} ($${item.precio})\n`);
    const texto = encodeURIComponent(`*NUEVO PEDIDO - MESA ${mesa}*\n---\n${detalle}*TOTAL: ${document.getElementById('total-precio').innerText}*`);
    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${texto}`, '_blank');
}

document.addEventListener('DOMContentLoaded', cargarMenu);
