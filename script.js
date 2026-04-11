// 1. CONFIGURACIÓN DE CONEXIÓN A SUPABASE
const SUPABASE_URL = "https://uuhtrbzviodclioqtmca.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aHRyYnp2aW9kY2xpb3F0bWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDQ2NTcsImV4cCI6MjA5MTQyMDY1N30.pROjzOh1pN52aDWDJCVWZ4TC6Nqu-cRidk_vAqckAxA"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. SISTEMA DE TRADUCCIÓN
const traducciones = {
    es: {
        mantenimiento: "MANTENIMIENTO",
        experiencia: "EXPERIENCIA ARTESANAL",
        pedido: "Tu Pedido",
        total: "TOTAL:",
        mesa: "N° DE MESA:",
        finalizar: "FINALIZAR PEDIDO",
        subir: "SUBIR AL MENÚ",
        nuevo: "Nuevo Producto",
        foto: "📸 Seleccionar Foto",
        entradas: "ENTRADAS",
        "platos-de-autor": "PLATOS DE AUTOR",
        comidas: "COMIDAS",
        acompañamientos: "ACOMPAÑAMIENTOS",
        postres: "POSTRES",
        "sin-alcohol": "SIN ALCOHOL",
        "con-alcohol": "CON ALCOHOL",
        agregar: "AGREGAR",
        borrar: "BORRAR",
        quitar: "Quitar",
        alerta_datos: "Ingresa n° de mesa y productos",
        alerta_admin: "Por favor, completa nombre, precio y selecciona una imagen."
    },
    en: {
        mantenimiento: "MAINTENANCE",
        experiencia: "ARTISAN EXPERIENCE",
        pedido: "Your Order",
        total: "TOTAL:",
        mesa: "TABLE N°:",
        finalizar: "PLACE ORDER",
        subir: "UPLOAD TO MENU",
        nuevo: "New Product",
        foto: "📸 Select Photo",
        entradas: "STARTERS",
        "platos-de-autor": "SIGNATURE DISHES",
        comidas: "MAINS",
        acompañamientos: "SIDES",
        postres: "DESSERTS",
        "sin-alcohol": "SOFT DRINKS",
        "con-alcohol": "ALCOHOLIC DRINKS",
        agregar: "ADD",
        borrar: "DELETE",
        quitar: "Remove",
        alerta_datos: "Enter table number and products",
        alerta_admin: "Please fill in name, price, and select an image."
    },
    pt: {
        mantenimiento: "MANUTENÇÃO",
        experiencia: "EXPERIÊNCIA ARTESANAL",
        pedido: "Seu Pedido",
        total: "TOTAL:",
        mesa: "N° DA MESA:",
        finalizar: "FINALIZAR PEDIDO",
        subir: "ADICIONAR AO MENU",
        nuevo: "Novo Produto",
        foto: "📸 Selecionar Foto",
        entradas: "ENTRADAS",
        "platos-de-autor": "PRATOS DE AUTOR",
        comidas: "REFEIÇÕES",
        acompañamientos: "ACOMPANHAMENTOS",
        postres: "SOBREMESAS",
        "sin-alcohol": "SEM ÁLCOOL",
        "con-alcohol": "COM ÁLCOOL",
        agregar: "ADICIONAR",
        borrar: "EXCLUIR",
        quitar: "Remover",
        alerta_datos: "Insira o número da mesa e os produtos",
        alerta_admin: "Por favor, preencha o nome, preço e selecione uma imagem."
    },
    fr: {
        mantenimiento: "MAINTENANCE",
        experiencia: "EXPÉRIENCE ARTISANALE",
        pedido: "Votre Commande",
        total: "TOTAL :",
        mesa: "N° DE TABLE :",
        finalizar: "PASSER COMMANDE",
        subir: "AJOUTER AU MENU",
        nuevo: "Nouveau Produit",
        foto: "📸 Sélectionner Photo",
        entradas: "ENTRÉES",
        "platos-de-autor": "PLATS SIGNATURE",
        comidas: "PLATS",
        acompañamientos: "ACCOMPAGNEMENTS",
        postres: "DESSERTS",
        "sin-alcohol": "SANS ALCOOL",
        "con-alcohol": "AVEC ALCOOL",
        agregar: "AJOUTER",
        borrar: "SUPPRIMER",
        quitar: "Retirer",
        alerta_datos: "Entrez le numéro de table et les produits",
        alerta_admin: "Veuillez remplir le nom, le prix et sélectionner une image."
    }
};

let idiomaActual = "es";
let carrito = [];
let isAdmin = false;

// 3. FUNCIONES DE IDIOMA
function cambiarIdioma(lang) {
    idiomaActual = lang;
    const t = traducciones[lang];

    // Traducir interfaz fija
    document.getElementById('btn-admin-view').innerText = t.mantenimiento;
    document.querySelector('.subtitle').innerText = t.experiencia;
    document.querySelector('#carrito .category-title').innerText = t.pedido;
    document.querySelector('.cart-total span:first-child').innerText = t.total;
    document.querySelector('.input-mesa label').innerText = t.mesa;
    document.querySelector('#carrito .btn-finalizar').innerText = t.finalizar;
    
    // Traducir panel admin si está abierto
    const adminTitle = document.querySelector('#form-admin .category-title');
    if(adminTitle) adminTitle.innerText = t.nuevo;
    
    const fileLabel = document.querySelector('.btn-file-label');
    if(fileLabel) fileLabel.innerText = t.foto;

    const adminBtn = document.querySelector('#form-admin .btn-finalizar');
    if(adminBtn) adminBtn.innerText = t.subir;

    // Traducir Navegación
    const navItems = document.querySelectorAll('.nav-item');
    const categoriasKeys = ["entradas", "platos-de-autor", "comidas", "acompañamientos", "postres", "sin-alcohol", "con-alcohol"];
    navItems.forEach((item, index) => {
        item.innerText = t[categoriasKeys[index]];
    });

    // Actualizar menú dinámico para cambiar títulos de categorías y botones
    cargarMenu();
    actualizarCarritoUI();
}

// 4. GESTIÓN DE ACCESO
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

// 5. CARGAR MENÚ
async function cargarMenu() {
    const { data: productos, error } = await _supabase
        .from('productos') 
        .select('*')
        .order('nombre', { ascending: true });

    if (error) {
        console.error("Error al cargar menú:", error);
        return;
    }

    const t = traducciones[idiomaActual];
    const menuDinamico = document.getElementById('menu-dinamico');
    menuDinamico.innerHTML = "";
    
    const categorias = ["entradas", "platos-de-autor", "comidas", "acompañamientos", "postres", "sin-alcohol", "con-alcohol"];
    
    categorias.forEach(cat => {
        const items = productos.filter(p => p.categoria === cat);
        if (items.length > 0) {
            let html = `<section id="${cat}"><div class="category-title">${t[cat]}</div><div class="lista-items">`;
            items.forEach(p => {
                const imgUrl = p.imagen_url || 'https://via.placeholder.com/150/111/c5a059?text=AIRES';
                const precioFormateado = parseFloat(p.precio).toFixed(2);

                html += `
                    <div class="menu-item">
                        <img src="${imgUrl}" class="item-img" onerror="this.src='https://via.placeholder.com/150/111/c5a059?text=AIRES'">
                        <div class="item-content">
                            <h3>${p.nombre}</h3>
                            <p class="price">€${precioFormateado}</p>
                            <div class="btn-container">
                                ${isAdmin ? `<button class="btn-borrar" onclick="eliminarProducto('${p.id}')">${t.borrar}</button>` : ''}
                                <button class="btn-order" onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">${t.agregar}</button>
                            </div>
                        </div>
                    </div>`;
            });
            html += `</div></section>`;
            menuDinamico.innerHTML += html;
        }
    });
}

// 6. SUBIR NUEVO PRODUCTO
async function guardarNuevoProducto() {
    const t = traducciones[idiomaActual];
    const nombre = document.getElementById('add-nombre').value;
    const precioInput = document.getElementById('add-precio').value; 
    const categoria = document.getElementById('add-categoria').value;
    const imagenFile = document.getElementById('add-imagen').files[0];

    if (!nombre || !precioInput || !imagenFile) {
        alert(t.alerta_admin);
        return;
    }

    try {
        const bucketName = 'imagenes'; 
        const fileName = `${Date.now()}_${imagenFile.name.replace(/\s/g, '_')}`;

        const { data: imgData, error: imgError } = await _supabase.storage
            .from(bucketName)
            .upload(fileName, imagenFile);

        if (imgError) throw imgError;

        const { data: publicUrlData } = _supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        const imagen_url = publicUrlData.publicUrl;
        const precioDecimal = parseFloat(precioInput);

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

// 7. CARRITO
function agregarAlCarrito(nombre, precio) {
    carrito.push({ nombre, precio: parseFloat(precio) });
    actualizarCarritoUI();
}

function quitarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const t = traducciones[idiomaActual];
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
                <button onclick="quitarDelCarrito(${index})" style="background:none; border:1px solid #ff4444; color:#ff4444; border-radius:4px; padding:4px 10px; font-size:0.65rem; cursor:pointer; text-transform:uppercase;">${t.quitar}</button>
            </div>`;
    });
    totalElem.innerText = `€${total.toFixed(2)}`;
}

// 8. ELIMINAR Y WHATSAPP
async function eliminarProducto(id) {
    if(!confirm("¿Eliminar plato?")) return;
    await _supabase.from('productos').delete().eq('id', id);
    cargarMenu();
}

function enviarWhatsApp() {
    const t = traducciones[idiomaActual];
    const mesa = document.getElementById('input-mesa').value;
    if(!mesa || carrito.length === 0) return alert(t.alerta_datos);
    let mensaje = `*PEDIDO MESA ${mesa} - AIRES ESTORIL*\n\n`;
    carrito.forEach(i => mensaje += `• ${i.nombre} - €${i.precio.toFixed(2)}\n`);
    mensaje += `\n*TOTAL: ${document.getElementById('total-precio').innerText}*`;
    window.open(`https://wa.me/34000000000?text=${encodeURIComponent(mensaje)}`);
}

window.onload = cargarMenu;
