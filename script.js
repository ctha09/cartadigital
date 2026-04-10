const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
const SUPABASE_KEY = "TU_KEY_ANON_AQUI"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEFONO_WHATSAPP = "543751246552";
let carrito = [];
let esAdmin = false;

// 1. CARGAR MENÚ
async function cargarMenu() {
    // Probamos con 'Productos' (P mayúscula). Si falla, cambialo a minúscula.
    const { data: productos, error } = await _supabase
        .from('Productos') 
        .select('*')
        .order('nombre', { ascending: true });

    if (error) {
        console.error("Error al cargar:", error.message);
        return;
    }

    const categorias = ['entradas', 'comidas', 'sin-alcohol', 'con-alcohol'];
    
    categorias.forEach(cat => {
        const divLista = document.querySelector(`#${cat} .lista`);
        if (!divLista) return;
        divLista.innerHTML = "";
        
        const filtrados = productos.filter(p => p.categoria === cat);

        filtrados.forEach(p => {
            let btnEliminar = esAdmin ? `<button onclick="eliminarProducto(${p.id})" style="background:none; border:1px solid #ff4444; color:#ff4444; padding:4px 8px; border-radius:4px; font-size:0.6rem; margin-top:5px; cursor:pointer;">BORRAR</button>` : "";

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

// 2. GUARDAR COMO ARCHIVO PURO (SIN COMPRESIÓN)
async function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const precio = document.getElementById('add-precio').value;
    const categoria = document.getElementById('add-categoria').value;
    const fotoArchivo = document.getElementById('add-imagen').files[0]; // El archivo original

    if(!nombre || !precio || !fotoArchivo) return alert("Faltan datos o la imagen.");

    try {
        // Generamos un nombre único para el archivo
        const extension = fotoArchivo.name.split('.').pop();
        const nombreArchivo = `${Date.now()}.${extension}`;

        // SUBIDA DIRECTA DEL ARCHIVO
        const { data: upData, error: upError } = await _supabase.storage
            .from('imagenes-menu')
            .upload(nombreArchivo, fotoArchivo, {
                cacheControl: '3600',
                upsert: false
            });

        if (upError) throw upError;

        // Obtenemos la URL pública
        const { data: urlData } = _supabase.storage.from('imagenes-menu').getPublicUrl(nombreArchivo);

        // Insertamos en la tabla
        const { error: dbError } = await _supabase
            .from('Productos')
            .insert([{ 
                nombre: nombre, 
                precio: parseInt(precio), 
                categoria: categoria, 
                imagen: urlData.publicUrl 
            }]);

        if (dbError) throw dbError;

        alert("¡Archivo subido y producto guardado!");
        location.reload();

    } catch (err) {
        alert("Error de subida: " + err.message);
        console.error(err);
    }
}

// --- RESTO DE FUNCIONES (Admin, Carrito, WhatsApp) ---
function toggleAdmin() {
    const pin = prompt("PIN de Mantenimiento:");
    if (pin === "031223") {
        esAdmin = true;
        document.getElementById('form-admin').style.display = 'block';
        cargarMenu();
    } else { alert("PIN incorrecto"); }
}

async function eliminarProducto(id) {
    if (confirm("¿Eliminar?")) {
        await _supabase.from('Productos').delete().eq('id', id);
        cargarMenu();
    }
}

function agregarAlCarrito(prod, prec) {
    carrito.push({ nombre: prod, precio: prec });
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    const lista = document.getElementById('lista-carrito');
    const totalTxt = document.getElementById('total-precio');
    lista.innerHTML = "";
    let suma = 0;
    carrito.forEach(item => {
        suma += item.precio;
        lista.innerHTML += `<div class="item-carrito"><span>${item.nombre}</span><span>$${item.precio}</span></div>`;
    });
    totalTxt.innerText = `$${suma}`;
}

function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if (carrito.length === 0 || !mesa) return alert("Faltan datos.");
    let detalle = "";
    carrito.forEach(item => detalle += `• ${item.nombre} ($${item.precio})\n`);
    const texto = encodeURIComponent(`*PEDIDO MESA ${mesa}*\n${detalle}*TOTAL: $${document.getElementById('total-precio').innerText}*`);
    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${texto}`, '_blank');
}

document.addEventListener('DOMContentLoaded', cargarMenu);
