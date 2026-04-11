const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aHRyYnp2aW9kY2xpb3F0bWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQ2NTcsImV4cCI6MjA5MTQyMDY1N30.pROjzOh1pN52aDWDJCVWZ4TC6Nqu-cRidk_vAqckAxA"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let carrito = [];
let isAdmin = false;

// CORRECCIÓN DE CONTRASEÑA
function toggleAdmin() {
    const pass = prompt("Clave de mantenimiento:");
    if(pass && pass.trim() === "1234") { // .trim() elimina espacios accidentales
        isAdmin = true;
        document.getElementById('form-admin').style.display = 'block';
        cargarMenu();
    } else {
        alert("Clave incorrecta");
    }
}

function cerrarAdmin() {
    isAdmin = false;
    document.getElementById('form-admin').style.display = 'none';
    cargarMenu();
}

// CARGAR MENÚ
async function cargarMenu() {
    const { data: productos, error } = await _supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });

    if (error) return console.error(error);

    const menuDinamico = document.getElementById('menu-dinamico');
    menuDinamico.innerHTML = "";
    
    const categorias = ["entradas", "comidas", "sin-alcohol", "con-alcohol"];
    
    categorias.forEach(cat => {
        const items = productos.filter(p => p.categoria === cat);
        if (items.length > 0) {
            let html = `<section id="${cat}"><div class="category-title">${cat.toUpperCase()}</div>`;
            items.forEach(p => {
                html += `
                    <div class="menu-item">
                        <img src="${p.imagen_url}" class="item-img" onerror="this.src='https://via.placeholder.com/150?text=Aires'">
                        <div class="item-content">
                            <h3>${p.nombre}</h3>
                            <p class="price">€${p.precio}</p>
                            <div class="btn-container">
                                ${isAdmin ? `<button class="btn-borrar" onclick="eliminarProducto('${p.id}')">BORRAR</button>` : ''}
                                <button class="btn-order" onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">AGREGAR</button>
                            </div>
                        </div>
                    </div>`;
            });
            html += `</section>`;
            menuDinamico.innerHTML += html;
        }
    });
}

// FUNCIÓN PARA SUBIR PRODUCTOS E IMÁGENES (Esto es lo que faltaba)
async function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value;
    const categoria = document.getElementById('add-categoria').value;
    const imagenFile = document.getElementById('add-imagen').files[0];

    if (!nombre || !precio || !imagenFile) return alert("Completa todos los campos e imagen");

    // 1. Subir imagen al Storage de Supabase
    const fileName = `${Date.now()}_${imagenFile.name}`;
    const { data: imgData, error: imgError } = await _supabase.storage
        .from('imagenes-productos') // Asegúrate de que tu bucket se llame así
        .upload(fileName, imagenFile);

    if (imgError) return alert("Error al subir imagen: " + imgError.message);

    const { data: publicUrlData } = _supabase.storage
        .from('imagenes-productos')
        .getPublicUrl(fileName);

    const imagen_url = publicUrlData.publicUrl;

    // 2. Guardar en la tabla
    const { error } = await _supabase
        .from('productos')
        .insert([{ nombre, precio: parseFloat(precio), categoria, imagen_url }]);

    if (error) alert("Error al guardar producto: " + error.message);
    else {
        alert("¡Producto subido!");
        location.reload(); // Recarga para limpiar todo
    }
}

// CARRITO
function agregarAlCarrito(nombre, precio) {
    carrito.push({ nombre, precio });
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const lista = document.getElementById('lista-carrito');
    let total = 0;
    lista.innerHTML = "";
    carrito.forEach(i => {
        total += i.precio;
        lista.innerHTML += `<div class="item-carrito" style="display:flex;justify-content:space-between"><span>${i.nombre}</span><span>€${i.precio}</span></div>`;
    });
    document.getElementById('total-precio').innerText = `€${total}`;
}

async function eliminarProducto(id) {
    if(!confirm("¿Eliminar plato?")) return;
    await _supabase.from('productos').delete().eq('id', id);
    cargarMenu();
}

function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if(!mesa || carrito.length === 0) return alert("Falta mesa o pedido");
    let msg = `*PEDIDO MESA ${mesa}*\n`;
    carrito.forEach(i => msg += `- ${i.nombre}\n`);
    msg += `*TOTAL: ${document.getElementById('total-precio').innerText}*`;
    window.open(`https://wa.me/34600000000?text=${encodeURIComponent(msg)}`);
}

window.onload = cargarMenu;
