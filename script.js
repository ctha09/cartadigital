// CONFIGURACIÓN DE CONEXIÓN A SUPABASE
const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aHRyYnp2aW9kY2xpb3F0bWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQ2NTcsImV4cCI6MjA5MTQyMDY1N30.pROjzOh1pN52aDWDJCVWZ4TC6Nqu-cRidk_vAqckAxA"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let carrito = [];
let isAdmin = false;

// 1. GESTIÓN DE ACCESO
function toggleAdmin() {
    const pass = prompt("Clave de mantenimiento:");
    if(pass && pass.trim() === "031223") { 
        isAdmin = true;
        document.getElementById('form-admin').style.display = 'block';
        cargarMenu();
        alert("Acceso concedido");
    } else {
        alert("Clave incorrecta.");
    }
}

function cerrarAdmin() {
    isAdmin = false;
    document.getElementById('form-admin').style.display = 'none';
    cargarMenu();
}

// 2. CARGAR MENÚ
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
            let html = `<section id="${cat}"><div class="category-title">${cat.replace("-", " ").toUpperCase()}</div><div class="lista-items">`;
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
            html += `</div></section>`;
            menuDinamico.innerHTML += html;
        }
    });
}

// 3. SUBIR NUEVO PRODUCTO (CON SOPORTE DECIMAL)
async function guardarNuevoProducto() {
    const nombre = document.getElementById('add-nombre').value;
    const precioInput = document.getElementById('add-precio').value; // Tomamos el valor como texto primero
    const categoria = document.getElementById('add-categoria').value;
    const imagenFile = document.getElementById('add-imagen').files[0];

    if (!nombre || !precioInput || !imagenFile) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    try {
        const bucketName = 'imagenes'; 
        const fileName = `${Date.now()}_${imagenFile.name.replace(/\s/g, '_')}`;

        // Subida de imagen
        const { data: imgData, error: imgError } = await _supabase.storage
            .from(bucketName)
            .upload(fileName, imagenFile);

        if (imgError) throw imgError;

        const { data: publicUrlData } = _supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        const imagen_url = publicUrlData.publicUrl;

        // Convertimos a número decimal usando parseFloat
        const precioDecimal = parseFloat(precioInput.replace(',', '.'));

        // Insertar en Tabla
        const { error: insertError } = await _supabase
            .from('productos')
            .insert([{ 
                nombre: nombre, 
                precio: precioDecimal, 
                categoria: categoria, 
                imagen_url: imagen_url 
            }]);

        if (insertError) throw insertError;

        alert("¡Producto subido con éxito!");
        document.getElementById('add-nombre').value = "";
        document.getElementById('add-precio').value = "";
        cargarMenu();

    } catch (err) {
        alert("Error: " + err.message);
    }
}

// 4. CARRITO
function agregarAlCarrito(nombre, precio) {
    carrito.push({ nombre, precio: parseFloat(precio) });
    actualizarCarritoUI();
}

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
            <div class="item-carrito" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-size: 0.95rem; font-weight: 600;">${item.nombre}</span>
                    <span style="color: var(--gold); font-size: 0.85rem;">€${item.precio.toFixed(2)}</span>
                </div>
                <button onclick="quitarDelCarrito(${index})" style="background:none; border:1px solid #ff4444; color:#ff4444; border-radius:4px; padding:4px 10px; font-size:0.65rem; cursor:pointer; text-transform:uppercase;">Quitar</button>
            </div>`;
    });
    totalElem.innerText = `€${total.toFixed(2)}`; // Mostramos siempre 2 decimales en el total
}

// 5. ELIMINAR Y WHATSAPP
async function eliminarProducto(id) {
    if(!confirm("¿Eliminar plato?")) return;
    await _supabase.from('productos').delete().eq('id', id);
    cargarMenu();
}

function enviarWhatsApp() {
    const mesa = document.getElementById('input-mesa').value;
    if(!mesa || carrito.length === 0) return alert("Falta mesa o pedido");
    let mensaje = `*PEDIDO MESA ${mesa} - AIRES ESTORIL*\n\n`;
    carrito.forEach(i => mensaje += `• ${i.nombre} - €${i.precio.toFixed(2)}\n`);
    mensaje += `\n*TOTAL: ${document.getElementById('total-precio').innerText}*`;
    window.open(`https://wa.me/34000000000?text=${encodeURIComponent(mensaje)}`);
}

window.onload = cargarMenu;
