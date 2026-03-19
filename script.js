/**
 * Lógica de Pedidos por WhatsApp
 * Integrado por: Carlos Thomas Acosta
 */

const TELEFONO_REGISTRADO = "543751246552"; 

function enviarPedido(producto, precio) {
    // Estructura el mensaje para que el mesero lo lea claro
    const mensaje = encodeURIComponent(
        `*NUEVO PEDIDO WEB*\n` +
        `• Producto: ${producto}\n` +
        `• Precio: $${precio}\n` +
        `--------------------------\n` +
        `Favor de confirmar recepción.`
    );

    // Abre el enlace directo a WhatsApp
    const url = `https://wa.me/${TELEFONO_REGISTRADO}?text=${mensaje}`;
    
    window.open(url, '_blank');
}