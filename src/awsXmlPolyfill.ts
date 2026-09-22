import { DOMParser as XmlDomParser } from '@xmldom/xmldom';

// O parser XML usado pelo SDK da AWS escolhe a implementação de navegador no
// React Native, mas esse runtime não fornece DOMParser nem as constantes Node.
if (typeof globalThis.DOMParser === 'undefined') {
  Object.assign(globalThis, { DOMParser: XmlDomParser });
}

if (typeof globalThis.Node === 'undefined') {
  Object.assign(globalThis, {
    Node: {
      ELEMENT_NODE: 1,
      TEXT_NODE: 3,
    },
  });
}
