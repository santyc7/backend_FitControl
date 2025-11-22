// src/routes/nutrition.ts
import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { buildPlan, Goal } from '../services/nutritionService.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try{
    const { uid, goal, profile } = req.body as {
      uid:string; goal:Goal; profile:{ sexo:'M'|'F'; edad:number; peso:number; altura:number; actividad:any }
    };
    if(!uid || !goal || !profile) return res.status(400).json({error:'Faltan datos'});

    const plan = buildPlan(uid, goal, profile);
    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);
    await userRef.collection('nutritionPlans').doc(plan.id).set(plan);
    await userRef.set({ activeNutritionPlanId: plan.id }, { merge:true });
    res.json(plan);
  }catch(e){ console.error(e); res.status(500).json({error:'No se pudo generar el plan'}); }
});

router.get('/current', async (req, res) => {
  try{
    const uid = String(req.query.uid||'');
    if(!uid) return res.status(400).json({error:'uid requerido'});
    const db = getFirestore();
    const user = await db.collection('users').doc(uid).get();
    const planId = user.get('activeNutritionPlanId');
    if(!planId) return res.status(404).json({error:'No hay plan activo'});
    const snap = await db.collection('users').doc(uid).collection('nutritionPlans').doc(planId).get();
    if(!snap.exists) return res.status(404).json({error:'Plan no encontrado'});
    res.json(snap.data());
  }catch(e){ console.error(e); res.status(500).json({error:'Error obteniendo plan'}); }
});

export default router;
