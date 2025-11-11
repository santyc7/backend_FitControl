// src/services/nutrition.ts
export type Goal = 'subir' | 'bajar' | 'mantener';

type Profile = {
  sexo: 'M'|'F';
  edad: number;
  peso: number;      // kg
  altura: number;    // cm
  actividad: 'sedentario'|'ligero'|'moderado'|'intenso'|'atleta';
};

export type MealItem = { name:string; kcal:number };
export type MealBlock = {
  code: 'desayuno'|'snack1'|'almuerzo'|'snack2'|'cena';
  title: string; time: string; targetKcal: number; items: MealItem[];
};
export type NutritionPlan = {
  id:string; uid:string; goal:Goal; totalKcal:number;
  macros:{ protein:number; carbs:number; fat:number };
  startDate:string; endDate:string; createdAt:string; meals:MealBlock[];
};

const activityFactor = { sedentario:1.2, ligero:1.375, moderado:1.55, intenso:1.725, atleta:1.9 };
const slots: MealBlock['code'][] = ['desayuno','snack1','almuerzo','snack2','cena'];
const titles = { desayuno:'Desayuno', snack1:'Snack mañana', almuerzo:'Almuerzo', snack2:'Snack tarde', cena:'Cena' };
const times  = { desayuno:'07:30',    snack1:'10:30',       almuerzo:'13:00',   snack2:'16:30',      cena:'19:30' };
const split  = { desayuno:0.25, snack1:0.10, almuerzo:0.35, snack2:0.10, cena:0.20 };

const menu = {
  prote: ['Pechuga de pollo','Claras de huevo','Atún en agua','Queso fresco','Carne magra'],
  carb:  ['Avena','Arroz integral','Pan integral','Papa cocida','Tortilla integral'],
  veg:   ['Lechuga','Tomate','Zanahoria','Espinaca','Pepino'],
  fat:   ['Aguacate','Maní','Almendras','Aceite de oliva','Semillas de chía'],
};
const pick = <T,>(a:T[])=>a[Math.floor(Math.random()*a.length)];

function bmr(sexo:'M'|'F', edad:number, peso:number, altura:number){
  return sexo==='M' ? 10*peso + 6.25*altura - 5*edad + 5
                    : 10*peso + 6.25*altura - 5*edad - 161;
}
function tdee(p:Profile){ return bmr(p.sexo,p.edad,p.peso,p.altura)*activityFactor[p.actividad]; }
function kcalForGoal(k:number, g:Goal){ if(g==='bajar') return Math.max(1200, Math.round(k-450)); if(g==='subir') return Math.round(k+300); return Math.round(k); }
function macros(total:number){ return {
  protein: Math.round((total*0.25)/4),
  carbs:   Math.round((total*0.45)/4),
  fat:     Math.round((total*0.30)/9),
};}

export function buildPlan(uid:string, goal:Goal, profile:Profile, days=7): NutritionPlan {
  const totalKcal = kcalForGoal(tdee(profile), goal);
  const meals: MealBlock[] = slots.map(code=>{
    const k = Math.round(totalKcal * (split as any)[code]);
    return {
      code, title: titles[code], time: times[code], targetKcal: k,
      items: [
        { name: pick(menu.prote), kcal: Math.round(k*0.35) },
        { name: pick(menu.carb),  kcal: Math.round(k*0.45) },
        { name: pick(menu.veg),   kcal: Math.round(k*0.10) },
        { name: pick(menu.fat),   kcal: Math.round(k*0.10) },
      ],
    };
  });
  const today = new Date(); const end = new Date(today); end.setDate(today.getDate()+days-1);
  return {
    id: `${today.toISOString().slice(0,10)}-${goal}`,
    uid, goal, totalKcal, macros: macros(totalKcal),
    startDate: today.toISOString().slice(0,10),
    endDate: end.toISOString().slice(0,10),
    createdAt: new Date().toISOString(),
    meals,
  };
}
