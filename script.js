// CONFIGURACIÓN SUPABASE
const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aHRyYnp2aW9kY2xpb3F0bWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQ2NTcsImV4cCI6MjA5MTQyMDY1N30.pROjzOh1pN52aDWDJCVWZ4TC6Nqu-cRidk_vAqckAxA"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let carrito = [];
let isAdmin = false;

// LOGIN DE ADMINISTRADOR - CLAVE CORREGIDA
function toggleAdmin() {
    const pass = prompt("Clave de mantenimiento:");
    // Ahora configurada exactamente con tu código 031223
    if(pass && pass.trim() === "031223") { 
        isAdmin = true;
        document.getElementById('form-admin').style.display = 'block';
        cargarMenu();
        alert("Acceso concedido");
    } else {
        alert("Clave incorrecta. Verifica el código.");
    }
}

function cerrarAdmin() {
    isAdmin = false;
    document.getElementById('form-admin').style.display = 'none';
    cargarMenu();
}

// CARGAR PRODUCTOS Y GESTIÓN DE IMÁGENES
async function cargarMenu() {
    // Forzamos la tabla en minúsculas para evitar el error de "Table not found"
    const { data: productos, error } = await _supabase
        .from('productos') 
        .select('*')
        .order('nombre', { ascending: true });

    if (error) {
        console.error("Error de Supabase:", error);
        return;
    }

    const menuDinamico = document.getElementById('menu-dinamico');
    menuDinamico.innerHTML = "";
    
    const categorias = ["entradas", "comidas", "sin-alcohol", "con-alcohol"];
    
    categorias.forEach(cat => {
        const itemsFiltrados = productos.filter(p => p.categoria === cat);
        if (itemsFiltrados.length > 0) {
            let html = `<section id="${cat}"><div class="category-title">${cat.replace("-", " ").toUpperCase()}</div>`;
            
            itemsFiltrados.forEach(p => {
                // Si la imagen falla, usamos una de respaldo con estética oscura
                const imgUrl = p.imagen_url ? p.imagen_url : 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=200&auto=format&fit=crop';
                
                html += `
                    <div class="menu-item">
                        <img src="${imgUrl}" class="item-img" onerror="this.src='https://via.placeholder.com/150/111/c5a059?text=AIRES'">
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

// ELIMINAR PRODUCTO
async function eliminarProducto(id) {
    if(!confirm("¿Deseas eliminar este plato permanentemente?")) return;
    const { error } = await _supabase.from('productos').delete().eq('id', id);
    if (error) alert("Error al eliminar");
    else cargarMenu();
}

// RESTO DE FUNCIONES (CARRITO Y WHATSAPP)
function agregarAlCarrito(nombre, precio) {
    carrito.push({ nombre, precio });
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const lista = document.getElementById('lista-carrito');
    const totalElem = document.getElementById('total-precio');
    lista.innerHTML = "";
    let total = 0;
    carrito.forEach(item => {
        total += item.precio;
        lista.innerHTML += `<div class="item-carrito" style="display:flex; justify-content:space-between; padding:5px 0;">
            <span>${item.nombre}</span><span>€${item.precio}</span></div>`;
    });
    totalElem.innerText = `€${total}`;
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
