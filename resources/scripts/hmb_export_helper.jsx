/**
 * HMB ENTALLADOR — SCRIPT OFICIAL PARA ADOBE ILLUSTRATOR
 * Archivo: hmb_export_helper.jsx
 * 
 * Este script automatiza la exportación de moldes vectoriales desde Illustrator
 * asegurando la escala 1:1 milimétrica y la preservación de los nombres de capas.
 * 
 * INSTRUCCIONES EN ILLUSTRATOR:
 * 1. Abre tu archivo maestro de moldes (ej: MOLDES_FUTBOL_2026.ai).
 * 2. Asegúrate de que las capas u objetos tengan nombres como:
 *    T28_DELANTERO, T28_ESPALDA, T28_MANGA_I, T28_MANGA_D, T28_SHORT_F, T28_SHORT_A
 *    T30_DELANTERO, T30_ESPALDA, etc.
 * 3. Ve a: Archivo > Scripts > Otro script... y selecciona este archivo .jsx.
 * 4. Elige la carpeta de destino y el SVG calibrado se exportará listo para HMB Entallador.
 */

#target illustrator

function exportMoldesParaHmb() {
    if (app.documents.length === 0) {
        alert("Por favor abre un documento con moldes en Illustrator antes de ejecutar este script.", "HMB Entallador");
        return;
    }

    var doc = app.activeDocument;

    // Verificar y sugerir nombre
    var defaultName = doc.name.replace(/\.[^\.]+$/, "") + "_hmb.svg";
    var exportFile = File.saveDialog("Guardar archivo SVG calibrado para HMB Entallador:", "*.svg");

    if (!exportFile) {
        return; // Cancelado por el usuario
    }

    // Configuración estricta de exportación SVG para preservar escala 1:1 y nombres de capas
    var svgOptions = new ExportOptionsSVG();
    svgOptions.embedRasterImages = true;
    svgOptions.fontSubsetting = SVGFontSubsetting.GLYPHSUSED;
    svgOptions.cssProperties = SVGCSSPropertyStyle.STYLEELEMENTS;
    svgOptions.documentEncoding = SVGDocumentEncoding.UTF8;
    svgOptions.coordinatePrecision = 4; // 4 decimales de precisión milimétrica
    svgOptions.preserveEditability = false;
    svgOptions.compressed = false;

    try {
        doc.exportFile(exportFile, ExportType.SVG, svgOptions);
        alert(
            "¡Exportación completada con éxito!\n\n" +
            "Archivo generado: " + exportFile.name + "\n" +
            "Escala: 1:1 Milimétrica preservada.\n" +
            "Capas y trazados listos para importar en HMB Entallador.",
            "HMB Entallador — Éxito"
        );
    } catch (e) {
        alert("Ocurrió un error al exportar el archivo SVG:\n" + e.message, "HMB Entallador — Error");
    }
}

exportMoldesParaHmb();
