const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aHRyYnp2aW9kY2xpb3F0bWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQ2NTcsImV4cCI6MjA5MTQyMDY1N30.pROjzOh1pN52aDWDJCVWZ4TC6Nqu-cRidk_vAqckAxA"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEFONO_WHATSAPP = "543751246552";
let carrito = [];
let esAdmin = false;

function actualizarNombreArchivo(input) {
    const display = document.getElementById('file-name-display');
    if (input.files && input.files[0]) {
        display.innerText = "Seleccionado: " + input.files[0].name;
    }
}

async function cargarMenu() {
    // CORREGIDO: Tabla en minúsculas 'productos'
    const { data: productos, error } = await _supabase
        .from('productos') 
        .select('*')
        .order('nombre', { ascending: true });

    if (error) return console.error("Error:", error.message);

    const categorias = ['entradas', 'comidas', 'sin-alcohol', 'con-alcohol'];
    
    categorias.forEach(cat => {
        const divLista = document.querySelector(`#${cat} .lista`);
        if (!divLista) return;
        divLista.innerHTML = "";
        
        const filtrados = productos.filter(p => p.categoria === cat);

        filtrados.forEach(p => {
            let btnEliminar = esAdmin ? `<button onclick="eliminarProducto(${p.id})" class="btn-borrar">BORRAR</button>` : "";
            divLista.innerHTML += `
                <div class="menu-item">
                    <img src="${p.imagen}" class="item-img">
                    <div class="item-content">
                        <div class="item-info"><h3>${p.nombre}</h3><span class="price">$${p.precio}</span></div>
                        <div class="item-actions">
                            ${btnEliminar}
                            <button class="btn-order" onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">AGREGAR</button>
                        </div>
                    </div>
                </div>`;
        });
    });
}

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

        // CORREGIDO: Tabla en minúsculas 'productos'
        const { error: dbError } = await _supabase.from('productos').insert([{ 
            nombre, precio: parseInt(precio), categoria, imagen: urlData.publicUrl 
        }]);

        if (dbError) throw dbError;
        alert("Producto agregado con éxito");
        location.reload();
    } catch (err) { alert("Error: " + err.message); }
}

function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if (carrito.length === 0 || !mesa) return alert("Pedido incompleto.");
    let detalle = "";
    carrito.forEach(item => detalle += `• ${item.nombre} ($${item.precio})\n`);
    
    // Identidad de marca actualizada en el mensaje
    const texto = encodeURIComponent(`*PEDIDO AIRES ESTORIL - MESA ${mesa}*\n${detalle}*TOTAL: $${document.getElementById('total-precio').innerText}*`);
    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${texto}`, '_blank');
}

function toggleAdmin() {
    const pin = prompt("PIN:");
    if (pin === "031223") {
        esAdmin = true;
        document.getElementById('form-admin').style.display = 'block';
        cargarMenu();
    }
}

function cerrarAdmin() {
    esAdmin = false;
    document.getElementById('form-admin').style.display = 'none';
    cargarMenu();
}

async function eliminarProducto(id) {
    if (confirm("¿Eliminar producto?")) {
        await _supabase.from('productos').delete().eq('id', id);
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

document.addEventListener('DOMContentLoaded', cargarMenu);
