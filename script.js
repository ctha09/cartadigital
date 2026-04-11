// CONFIGURACIÓN SUPABASE
const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aHRyYnp2aW9kY2xpb3F0bWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQ2NTcsImV4cCI6MjA5MTQyMDY1N30.pROjzOh1pN52aDWDJCVWZ4TC6Nqu-cRidk_vAqckAxA"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let carrito = [];
let isAdmin = false;

// LOGIN DE ADMINISTRADOR
function toggleAdmin() {
    const pass = prompt("Clave de mantenimiento:");
    if(pass && pass.trim() === "031223") { 
        isAdmin = true;
        document.getElementById('form-admin').style.display = 'block';
        cargarMenu();
    } else {
        alert("Clave incorrecta.");
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

    if (error) return;

    const menuDinamico = document.getElementById('menu-dinamico');
    menuDinamico.innerHTML = "";
    
    const categorias = ["entradas", "comidas", "sin-alcohol", "con-alcohol"];
    
    categorias.forEach(cat => {
        const items = productos.filter(p => p.categoria === cat);
        if (items.length > 0) {
            let html = `<section id="${cat}"><div class="category-title">${cat.replace("-", " ").toUpperCase()}</div>`;
            items.forEach(p => {
                const imgUrl = p.imagen_url || 'https://via.placeholder.com/150/111/c5a059?text=AIRES';
                html += `
                    <div class="menu-item">
                        <img src="${imgUrl}" class="item-img" onerror="this.src='https://via.placeholder.com/150/111/c5a059?text=AIRES'">
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

// GESTIÓN DEL CARRITO (NUEVA FUNCIÓN DE BORRADO INDIVIDUAL)
function agregarAlCarrito(nombre, precio) {
    carrito.push({ nombre, precio });
    actualizarCarritoUI();
}

// Esta función permite quitar un producto específico por su índice
function quitarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const lista = document.getElementById('lista-carrito');
    const totalElem = document.getElementById('total-precio');
    lista.innerHTML = "";
    let total = 0;

    carrito.forEach((item, index) => {
        total += item.precio;
        lista.innerHTML += `
            <div class="item-carrito" style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-size: 0.9rem;">${item.nombre}</span>
                    <span style="color: var(--gold); font-size: 0.8rem;">€${item.precio}</span>
                </div>
                <button onclick="quitarDelCarrito(${index})" style="background:none; border:1px solid #ff4444; color:#ff4444; border-radius:4px; padding:2px 8px; font-size:0.6rem; cursor:pointer; text-transform:uppercase;">Quitar</button>
            </div>`;
    });
    totalElem.innerText = `€${total}`;
}

// FUNCIONES ADMIN
async function eliminarProducto(id) {
    if(!confirm("¿Deseas eliminar este plato permanentemente?")) return;
    await _supabase.from('productos').delete().eq('id', id);
    cargarMenu();
}

function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if(!mesa || carrito.length === 0) return alert("Ingresa n° de mesa y productos");
    let mensaje = `*PEDIDO MESA ${mesa} - AIRES ESTORIL*\n\n`;
    carrito.forEach(i => mensaje += `• ${i.nombre} - €${i.precio}\n`);
    mensaje += `\n*TOTAL: ${document.getElementById('total-precio').innerText}*`;
    window.open(`https://wa.me/34600000000?text=${encodeURIComponent(mensaje)}`);
}

window.onload = cargarMenu;
