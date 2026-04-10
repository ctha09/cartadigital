const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
const SUPABASE_KEY = "sb_publishable_8rn7tgMAt037eu7RfkIIyA_S10VA..."; // Reemplaza con tu clave completa
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEFONO_WHATSAPP = "543751246552";
let carrito = [];
let esAdmin = false;

// 1. CARGAR PRODUCTOS DESDE SUPABASE
async function cargarMenu() {
    const { data: productos, error } = await _supabase
        .from('Productos')
        .select('*')
        .order('nombre', { ascending: true });

    if (error) return console.error("Error:", error);

    const categorias = ['entradas', 'comidas', 'sin-alcohol', 'con-alcohol'];
    
    categorias.forEach(cat => {
        const contenedor = document.querySelector(`#${cat} .lista`);
        if (!contenedor) return;
        contenedor.innerHTML = "";
        
        const filtrados = productos.filter(p => p.categoria === cat);

        filtrados.forEach(p => {
            let botonBorrar = esAdmin ? `<button onclick="eliminarProducto(${p.id})" style="color:red; background:none; border:none; cursor:pointer; font-size:0.7rem; margin-top:5px;">🗑 Eliminar</button>` : "";
            
            contenedor.innerHTML += `
                <div class="menu-item">
                    <img src="${p.imagen}" class="item-img" alt="${p.nombre}" loading="lazy">
                    <div class="item-content">
                        <div class="item-info">
                            <h3>${p.nombre}</h3>
                            <span class="price">$${p.precio}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                            ${botonBorrar}
                            <button class="btn-order" onpointerdown="agregarAlCarrito('${p.nombre}', ${p.precio})">AGREGAR</button>
                        </div>
                    </div>
                </div>
            `;
        });
    });
}

// 2. AGREGAR NUEVO PRODUCTO (SUBIDA DE IMAGEN)
async function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value;
    const categoria = document.getElementById('add-categoria').value;
    const foto = document.getElementById('add-imagen').files[0];

    if(!nombre || !precio || !foto) return alert("Completa todos los datos y la foto.");

    try {
        // Subir imagen al Bucket 'imagenes-menu'
        const nombreImg = `${Date.now()}_${foto.name}`;
        const { error: upErr } = await _supabase.storage.from('imagenes-menu').upload(nombreImg, foto);
        if(upErr) throw upErr;

        // Obtener URL pública
        const { data: urlData } = _supabase.storage.from('imagenes-menu').getPublicUrl(nombreImg);
        const urlPublica = urlData.publicUrl;

        // Guardar en tabla
        const { error: dbErr } = await _supabase.from('Productos').insert([
            { nombre, precio: parseInt(precio), categoria, imagen: urlPublica }
        ]);

        if(dbErr) throw dbErr;
        alert("¡Plato guardado!");
        location.reload();
    } catch (e) { alert(e.message); }
}

// 3. MODO ADMIN
function toggleAdmin() {
    const pin = prompt("PIN Admin:");
    if(pin === "031223") {
        esAdmin = true;
        document.getElementById('form-admin').style.display = 'block';
        cargarMenu();
    }
}

async function eliminarProducto(id) {
    if(confirm("¿Borrar este producto?")) {
        await _supabase.from('Productos').delete().eq('id', id);
        cargarMenu();
    }
}

// 4. LÓGICA DE CARRITO (Mantenida igual)
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
                    <span>${item.nombre} <small onclick="quitar(${index})" style="color:var(--gold); cursor:pointer;">(quitar)</small></span>
                    <span>$${item.precio}</span>
                </div>`;
        });
    }
    totalTxt.innerText = `$${suma}`;
}

function quitar(index) {
    carrito.splice(index, 1);
    actualizarVistaCarrito();
}

function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if (carrito.length === 0 || !mesa) return alert("Completa el pedido y la mesa.");

    let detalle = "";
    carrito.forEach(item => detalle += `• ${item.nombre} ($${item.precio})\n`);
    const texto = encodeURIComponent(`*NUEVO PEDIDO - MESA ${mesa}*\n---\n${detalle}\n*TOTAL: $${document.getElementById('total-precio').innerText}*`);
    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${texto}`, '_blank');
}

document.addEventListener('DOMContentLoaded', cargarMenu);
