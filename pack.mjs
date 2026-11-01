import {NodeIO} from '@gltf-transform/core';import {textureCompress,prune,dedup,resample} from '@gltf-transform/functions';import sharp from 'sharp';
const io=new NodeIO();const B='/tmp/itch/universal-base-characters/Universal Base Characters[Standard]';
const H=B+'/Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/';
const jobs=[[B+'/Base Characters/Godot - UE/Superhero_Male_FullBody.gltf','male'],[B+'/Base Characters/Godot - UE/Superhero_Female_FullBody.gltf','female']];
for(const h of['Hair_Buzzed','Hair_Long','Hair_SimpleParted','Hair_Buns','Hair_Beard','Hair_BuzzedFemale'])jobs.push([H+h+'.gltf',h.toLowerCase()]);
for(const[f,n]of jobs){const d=await io.read(f);await d.transform(dedup(),prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:82}));await io.write('public/models/'+n+'.glb',d);}
// animations
const d=await io.read('/tmp/itch/universal-animation-library/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb');
const keep=['Idle_Loop','Walk_Loop','Jog_Fwd_Loop','Sprint_Loop','Pistol_Idle_Loop','Pistol_Shoot','Pistol_Aim_Neutral','Pistol_Reload','Death01','Hit_Chest','Crouch_Idle_Loop','Crouch_Fwd_Loop','Sitting_Idle_Loop','Idle_Talking_Loop','Interact','Driving_Loop','Punch_Cross','Punch_Jab','Fixing_Kneeling','Idle_Torch_Loop','Roll','PickUp_Table','Push_Loop'];
const r=d.getRoot();r.listAnimations().forEach(a=>{if(!keep.includes(a.getName()))a.dispose()});r.listMeshes().forEach(m=>m.dispose());
r.listNodes().forEach(n=>{if(n.getSkin())n.setSkin(null)});await d.transform(resample(),prune({keepLeaves:true}));await io.write('public/models/anims.glb',d);
