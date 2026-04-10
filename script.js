const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
const SUPABASE_KEY = "sb_publishable_8rn7tgMAt037eu7RfkIIyA_S10VA..."; // Tu clave de la captura
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
            // Botón de eliminar solo visible para admin
            let btnEliminar = esAdmin ? `<button onclick="eliminarProducto(${p.id})" style="background:none; border:1px solid red; color:red; padding:4px 8px; border-radius:4px; font-size:0.6rem; margin-top:5px; cursor:pointer;">ELIMINAR</button>` : "";

            divLista.innerHTML += `
                <div class="menu-item">
                    <img src="${p.imagen}" class="item-img" alt="${p.nombre}">
                    <div class="item-content">
                        <div class="item-info"><h3>${p.nombre}</h3><span class="price">$${p.precio}</span></div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                            ${btnEliminar}
                            <button class="btn-order" onpointerdown="agregarAlCarrito('${p.nombre}', ${p.precio})">AGREGAR</button>
                        </div>
                    </div>
                </div>`;
        });
    });
}

// 2. MODO ADMINISTRADOR (Activa al tocar tu nombre en el footer)
function toggleAdmin() {
    const pin = prompt("PIN de Seguridad:");
    if (pin === "031223") {
        esAdmin = true;
        document.getElementById('form-admin').style.display = 'block';
        cargarMenu();
        alert("Modo Editor Activado");
    } else {
        alert("PIN Incorrecto");
    }
}

function cerrarAdmin() {
    esAdmin = false;
    document.getElementById('form-admin').style.display = 'none';
    cargarMenu();
}

// 3. GUARDAR PRODUCTO CON FOTO DE GALERÍA
async function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value;
    const categoria = document.getElementById('add-categoria').value;
    const fotoArchivo = document.getElementById('add-imagen').files[0];

    if(!nombre || !precio || !fotoArchivo) return alert("Completa todos los campos.");

    try {
        const nombreArchivo = `${Date.now()}_${fotoArchivo.name}`;
        const { error: upError } = await _supabase.storage.from('imagenes-menu').upload(nombreArchivo, fotoArchivo);
        if (upError) throw upError;

        const { data: urlData } = _supabase.storage.from('imagenes-menu').getPublicUrl(nombreArchivo);

        const { error: dbError } = await _supabase.from('Productos').insert([
            { nombre, precio: parseInt(precio), categoria, imagen: urlData.publicUrl }
        ]);

        if (dbError) throw dbError;
        alert("¡Plato publicado!");
        location.reload();
    } catch (err) { alert("Error: " + err.message); }
}

async function eliminarProducto(id) {
    if (confirm("¿Eliminar este plato?")) {
        await _supabase.from('Productos').delete().eq('id', id);
        cargarMenu();
    }
}

// 4. CARRITO Y WHATSAPP (Tus funciones originales)
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
    if (carrito.length === 0 || !mesa) return alert("Completa el pedido y la mesa.");
    let detalle = "";
    carrito.forEach(item => detalle += `• ${item.nombre} ($${item.precio})\n`);
    const texto = encodeURIComponent(`*NUEVO PEDIDO - MESA ${mesa}*\n---\n${detalle}*TOTAL: $${document.getElementById('total-precio').innerText}*`);
    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${texto}`, '_blank');
}

document.addEventListener('DOMContentLoaded', cargarMenu);
