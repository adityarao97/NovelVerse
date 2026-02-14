import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { GeneratedNovel } from './novel-storage';

export const generateEpub = async (novel: GeneratedNovel) => {
    const zip = new JSZip();

    // 1. mimetype (must be first, no compression)
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

    // 2. META-INF/container.xml
    zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`);

    // 3. OEBPS folder
    const oebps = zip.folder("OEBPS");

    // Content HTML
    // Convert markdown-ish content to HTML
    const htmlContent = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>${novel.title}</title>
    <style>
        body { font-family: serif; line-height: 1.6; }
        h1 { text-align: center; margin-bottom: 2em; }
        p { margin-bottom: 1em; text-indent: 1em; }
    </style>
</head>
<body>
    <h1>${novel.title}</h1>
    ${novel.content.split('\n').map(line => {
        if (line.startsWith('# ')) return `<h1>${line.replace('# ', '')}</h1>`;
        if (line.startsWith('## ')) return `<h2>${line.replace('## ', '')}</h2>`;
        if (line.trim() === '---') return '<hr/>';
        if (!line.trim()) return '';
        return `<p>${line}</p>`;
    }).join('\n')}
</body>
</html>`;

    oebps?.file("chapter.xhtml", htmlContent);

    // content.opf
    const opfContent = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:title>${novel.title}</dc:title>
        <dc:creator>NovelVerse AI</dc:creator>
        <dc:language>en</dc:language>
        <dc:identifier id="BookId">urn:uuid:${novel.id}</dc:identifier>
    </metadata>
    <manifest>
        <item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    </manifest>
    <spine toc="ncx">
        <itemref idref="chapter"/>
    </spine>
</package>`;

    oebps?.file("content.opf", opfContent);

    // toc.ncx
    const ncxContent = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="urn:uuid:${novel.id}"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle><text>${novel.title}</text></docTitle>
    <navMap>
        <navPoint id="navPoint-1" playOrder="1">
            <navLabel><text>Start</text></navLabel>
            <content src="chapter.xhtml"/>
        </navPoint>
    </navMap>
</ncx>`;

    oebps?.file("toc.ncx", ncxContent);

    // Generate blob
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${novel.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.epub`);
};
