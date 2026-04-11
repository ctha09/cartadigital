// CONFIGURACIÓN SUPABASE
const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aHRyYnp2aW9kY2xpb3F0bWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQ2NTcsImV4cCI6MjA5MTQyMDY1N30.pROjzOh1pN52aDWDJCVWZ4TC6Nqu-cRidk_vAqckAxA"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let carrito = [];
let isAdmin = false;

// LOGIN DE ADMINISTRADOR
function toggleAdmin() {
    const pass = prompt("Clave de mantenimiento:");
    if(pass === "1234") { 
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

// CARGAR PRODUCTOS DESDE SUPABASE
async function cargarMenu() {
    const { data: productos, error } = await _supabase
        .from('productos') // Corrección de tabla en minúscula
        .select('*')
        .order('nombre', { ascending: true });

    if (error) return console.error("Error:", error);

    const menuDinamico = document.getElementById('menu-dinamico');
    menuDinamico.innerHTML = "";
    
    const categorias = ["entradas", "comidas", "sin-alcohol", "con-alcohol"];
    
    categorias.forEach(cat => {
        const itemsFiltrados = productos.filter(p => p.categoria === cat);
        if (itemsFiltrados.length > 0) {
            let html = `<section id="${cat}"><div class="category-title">${cat.replace("-", " ").toUpperCase()}</div>`;
            
            itemsFiltrados.forEach(p => {
                html += `
                    <div class="menu-item">
                        <img src="${p.imagen_url}" class="item-img" onerror="this.src='https://via.placeholder.com/100'">
                        <div class="item-content">
                            <div class="item-info">
                                <h3>${p.nombre}</h3>
                                <p class="price">€${p.precio}</p>
                            </div>
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

// GESTIÓN DEL CARRITO
function agregarAlCarrito(nombre, precio) {
    carrito.push({ nombre, precio });
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
            <div class="item-carrito" style="display:flex; justify-content:space-between; padding:5px 0;">
                <span>${item.nombre}</span>
                <span>€${item.precio}</span>
            </div>`;
    });
    totalElem.innerText = `€${total}`;
}

// ELIMINAR PRODUCTO (SÓLO ADMIN)
async function eliminarProducto(id) {
    if(!confirm("¿Seguro que deseas eliminar este producto?")) return;
    const { error } = await _supabase.from('productos').delete().eq('id', id);
    if (error) alert("Error al borrar");
    else cargarMenu();
}

// ENVIAR POR WHATSAPP
function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if(!mesa) return alert("Por favor, ingresa el número de mesa");
    if(carrito.length === 0) return alert("Tu carrito está vacío");

    let mensaje = `*PEDIDO MESA ${mesa} - AIRES ESTORIL*\n\n`;
    carrito.forEach(i => mensaje += `• ${i.nombre} - €${i.precio}\n`);
    mensaje += `\n*TOTAL: ${document.getElementById('total-precio').innerText}*`;

    const url = `https://wa.me/34600000000?text=${encodeURIComponent(mensaje)}`; // Cambia el número
    window.open(url, '_blank');
}

// INICIO
window.onload = cargarMenu;
