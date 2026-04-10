/* CULINARIA - SISTEMA DE GESTIÓN DINÁMICA
   Programado por: Carlos Thomas Acosta
*/

// 1. CONFIGURACIÓN DE CONEXIÓN
const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co"; 
const SUPABASE_KEY = "TU_CLAVE_ANON_LARGA_AQUÍ"; // sb_publishable_8rn7tgMAtO37eu7RfkIIyA_Sl0VAqlm
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEFONO_WHATSAPP = "543751246552";
let carrito = [];
let esAdmin = false;

// 2. CARGAR MENÚ DESDE LA BASE DE DATOS
async function cargarMenu() {
    // Traemos todos los productos de la tabla
    const { data: productos, error } = await _supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });

    if (error) {
        console.error("Error cargando el menú:", error);
        return;
    }

    const categorias = ['entradas', 'comidas', 'sin-alcohol', 'con-alcohol'];
    
    categorias.forEach(cat => {
        const divLista = document.querySelector(`#${cat} .lista`);
        if (!divLista) return;
        
        divLista.innerHTML = ""; 
        const filtrados = productos.filter(p => p.categoria === cat);

        if (filtrados.length === 0) {
            divLista.innerHTML = '<p style="opacity:0.3; padding:10px;">No hay productos en esta sección.</p>';
        }

        filtrados.forEach(p => {
            // Si el modo admin está activo, mostramos botones de edición
            let controlesAdmin = esAdmin ? `
                <div class="admin-actions">
                    <button onclick="editarPrecio(${p.id}, ${p.precio})">✎ Precio</button>
                    <button onclick="eliminarProducto(${p.id})" class="btn-del">🗑 Borrar</button>
                </div>` : "";

            divLista.innerHTML += `
                <div class="menu-item">
                    <img src="${p.imagen}" class="item-img" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/100?text=Plato'">
                    <div class="item-content">
                        <div class="item-info">
                            <h3>${p.nombre}</h3>
                            <span class="price">$${p.precio}</span>
                        </div>
                        ${controlesAdmin}
                        <button class="btn-order" onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">AGREGAR</button>
                    </div>
                </div>`;
        });
    });
}

// 3. LÓGICA DEL MODO ADMINISTRADOR (CELULAR)
function toggleAdmin() {
    if (!esAdmin) {
        const pin = prompt("PIN de Seguridad Administrador:");
        if (pin === "031223") {
            esAdmin = true;
            document.getElementById('form-nuevo-producto').style.display = 'block';
            document.getElementById('btn-admin-toggle').innerText = "SALIR MODO EDITOR";
            alert("Modo Edición Activado");
            cargarMenu();
        } else { 
            alert("PIN Incorrecto"); 
        }
    } else {
        esAdmin = false;
        document.getElementById('form-nuevo-producto').style.display = 'none';
        document.getElementById('btn-admin-toggle').innerText = "MODO ADMIN";
        cargarMenu();
    }
}

// Guardar nuevo producto en Supabase
async function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value;
    const categoria = document.getElementById('add-categoria').value;
    const imagen = document.getElementById('add-imagen').value || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200";

    if(!nombre || !precio) {
        return alert("Debes completar al menos el nombre y el precio.");
    }

    const { error } = await _supabase
        .from('productos')
        .insert([{ 
            nombre: nombre, 
            precio: parseInt(precio), 
            categoria: categoria, 
            imagen: imagen 
        }]);

    if (error) {
        alert("Error al publicar: " + error.message);
    } else {
        alert("¡Producto publicado con éxito!");
        // Limpiamos los campos
        document.getElementById('add-nombre').value = "";
        document.getElementById('add-precio').value = "";
        cargarMenu();
    }
}

// Editar precio rápidamente
async function editarPrecio(id, precioActual) {
    const nuevo = prompt("Ingresa el nuevo precio para este producto:", precioActual);
    if (nuevo && !isNaN(nuevo)) {
        const { error } = await _supabase
            .from('productos')
            .update({ precio: parseInt(nuevo) })
            .eq('id', id);
        
        if (!error) cargarMenu();
        else alert("Error al actualizar precio");
    }
}

// Eliminar producto de la base de datos
async function eliminarProducto(id) {
    if (confirm("¿Estás seguro de que quieres eliminar este plato del menú?")) {
        const { error } = await _supabase
            .from('productos')
            .delete()
            .eq('id', id);
        
        if (!error) cargarMenu();
        else alert("Error al eliminar");
    }
}

// 4. LÓGICA DEL CARRITO Y WHATSAPP
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
        carrito.forEach((item, index) => {
            suma += item.precio;
            lista.innerHTML += `
                <div class="item-carrito">
                    <span>${item.nombre}</span>
                    <div>
                        <span>$${item.precio}</span>
                        <button onclick="quitarDelCarrito(${index})" style="background:none; border:none; color:#ff4444; margin-left:10px;">✕</button>
                    </div>
                </div>`;
        });
    }
    totalTxt.innerText = `$${suma}`;
}

function quitarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarVistaCarrito();
}

function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if (carrito.length === 0) { 
        alert("El carrito está vacío."); 
        return; 
    }
    if (!mesa) { 
        alert("Por favor, indica el número de mesa."); 
        return; 
    }

    let detalle = "";
    carrito.forEach(item => detalle += `• ${item.nombre} ($${item.precio})\n`);
    
    const total = document.getElementById('total-precio').innerText;
    const mensaje = `*NUEVO PEDIDO - MESA ${mesa}*\n---\n${detalle}\n*TOTAL: ${total}*`;
    
    const url = `https://wa.me/${TELEFONO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// Iniciar la carga al abrir la web
document.addEventListener('DOMContentLoaded', cargarMenu);
