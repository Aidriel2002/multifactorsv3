import { db } from '@/app/lib/firebase/firebase';
import { collection, getDocs, query, where, DocumentData } from 'firebase/firestore';

export interface Project {
  id: string;
  projectRefNo: string;
  projectName: string;
  clientName?: string;
}

export interface Quotation extends DocumentData {
  id: string;
  projectRefNo: string;
}

export interface PurchaseOrder extends DocumentData {
  id: string;
  projectRefNo?: string;
  RefNo?: string;
}

export interface LinkedData {
  project: Project;
  quotations: Quotation[];
  purchaseOrders: PurchaseOrder[];
}

export const fetchLinkedData = async (): Promise<LinkedData[]> => {
  const projectsSnap = await getDocs(collection(db, 'projects'));
  const projectList: Project[] = projectsSnap.docs.map((doc) => ({
    id: doc.id,
    projectRefNo: doc.data().projectRefNo || doc.data().refNo || '',
    projectName: doc.data().projectName || '',
    clientName: doc.data().clientName || '',
  }));

  const results = await Promise.all(
    projectList.map(async (proj) => {
      // Fetch quotations
      const qSnap = await getDocs(
        query(collection(db, 'quotations'), where('projectRefNo', '==', proj.projectRefNo))
      );
      const quotations: Quotation[] = qSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Quotation[];

      // Fetch purchase orders
      const poSnap1 = await getDocs(
        query(collection(db, 'purchaseOrders'), where('projectRefNo', '==', proj.projectRefNo))
      );
      const poSnap2 = await getDocs(
        query(collection(db, 'purchaseOrders'), where('RefNo', '==', proj.projectRefNo))
      );
      const purchaseOrders: PurchaseOrder[] = [
        ...poSnap1.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        ...poSnap2.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      ];

      return { project: proj, quotations, purchaseOrders };
    })
  );

  return results;
};