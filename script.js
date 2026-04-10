const SUPABASE_URL = "TU_URL_DE_SUPABASE";
const SUPABASE_KEY = "TU_KEY_ANON_DE_SUPABASE";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEFONO_WHATSAPP = "543751246552";
let carrito = [];
let esAdmin = false;

// 1. CARGAR MENÚ
async function cargarMenu() {
    const { data: productos, error } = await _supabase.from('productos').select('*');
    if (error) return;

    const categorias = ['entradas', 'comidas', 'sin-alcohol', 'con-alcohol'];
    categorias.forEach(cat => {
        const divLista = document.querySelector(`#${cat} .lista`);
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

async function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value;
    const categoria = document.getElementById('add-categoria').value;
    const imagen = document.getElementById('add-imagen').value || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200";

    if(!nombre || !precio) return alert("Completa nombre y precio");

    const { error } = await _supabase.from('productos').insert([{ nombre, precio: parseInt(precio), categoria, imagen }]);
    if (!error) { alert("¡Publicado!"); location.reload(); }
}

async function editarPrecio(id, precioActual) {
    const nuevo = prompt("Nuevo precio:", precioActual);
    if (nuevo) {
        await _supabase.from('productos').update({ precio: parseInt(nuevo) }).eq('id', id);
        cargarMenu();
    }
}

async function eliminarProducto(id) {
    if (confirm("¿Eliminar este plato?")) {
        await _supabase.from('productos').delete().eq('id', id);
        cargarMenu();
    }
}

// 3. CARRITO (Tu lógica original)
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
            lista.innerHTML += `<div class="item-carrito"><span>${item.nombre}</span><span>$${item.precio}</span></div>`;
        });
    }
    totalTxt.innerText = `$${suma}`;
}

function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if (carrito.length === 0 || !mesa) { alert("Agrega productos e indica la mesa."); return; }
    let detalle = "";
    carrito.forEach(item => detalle += `• ${item.nombre} ($${item.precio})\n`);
    const texto = encodeURIComponent(`*NUEVO PEDIDO - MESA ${mesa}*\n---\n${detalle}*TOTAL: ${document.getElementById('total-precio').innerText}*`);
    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${texto}`, '_blank');
}

document.addEventListener('DOMContentLoaded', cargarMenu);
