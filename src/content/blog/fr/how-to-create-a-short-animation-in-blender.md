---
draft: false
title: "Comment créer une courte animation dans Blender"
snippet: "Un walkthrough accessible pour créer votre première courte animation dans Blender, du modeling d'une scène simple jusqu'au rendu final."
image:
  {
    src: "/blog/blender-box-fall.mp4",
    alt: "Animation Blender de lettres dorées qui tombent sur une plateforme",
  }
publishDate: "2026-03-09 10:00"
category: "Tutoriels"
author: "Hadouin"
tags: [blender, 3d, animation]
---

Blender est une suite 3D libre et open-source qui couvre tout, du modeling à l'animation jusqu'au montage vidéo. Dans ce post, je vous guide pour créer une courte animation simple à partir de zéro.

## Préparer la scène

Quand vous ouvrez Blender, vous tombez sur le cube par défaut. Pour une fois, on le garde. On supprime d'abord la lumière et la caméra par défaut, on les replacera proprement plus tard.

1. Sélectionnez le cube et appuyez sur **S** pour le scaler le long de l'axe Z (**S** > **Z** > **0.2**) pour qu'il ressemble à une plateforme
2. Ajoutez une UV Sphere (**Shift+A** > Mesh > UV Sphere) et placez-la au-dessus de la plateforme
3. Ajoutez une lumière (**Shift+A** > Light > Area) et positionnez-la au-dessus et sur le côté de la scène
4. Ajoutez une caméra (**Shift+A** > Camera) et faites **Ctrl+Alt+Numpad 0** pour la caler sur le viewport courant

## Ajouter des matériaux

Sélectionnez la plateforme, allez dans l'onglet **Material Properties** et créez un nouveau matériau. Réglez la base color sur un gris foncé. Faites pareil pour la sphère mais avec une couleur vive comme orange ou bleu.

Pour de meilleurs résultats, basculez sur le moteur **Eevee** et activez **Screen Space Reflections** dans les render settings.

## Keyframer l'animation

C'est ici que ça devient fun. On va faire rebondir la sphère sur la plateforme.

1. Mettez la timeline sur **frame 1**
2. Sélectionnez la sphère, appuyez sur **I** et choisissez **Location** pour insérer une keyframe
3. Allez à **frame 15**, descendez la sphère pour qu'elle touche la plateforme et insérez une autre keyframe
4. Allez à **frame 30**, remontez la sphère (moins haut qu'au début) et keyframez à nouveau
5. Répétez ce pattern avec une hauteur qui décroît pour un rebond naturel

### Ajuster les courbes

Ouvrez le **Graph Editor** et sélectionnez toutes les keyframes. Changez l'interpolation en **Bounce** ou ajustez manuellement les handles bezier pour avoir un rebond fluide. La clé : que la descente soit plus rapide que la montée.

## Ajouter un fond simple

Au lieu d'un fond gris uni :

1. Allez dans **World Properties**
2. Mettez la surface sur **Background**
3. Utilisez un dégradé subtil en branchant un nœud **Gradient Texture** via un **Color Ramp** dans la background color

## Mouvement de caméra

Une caméra statique, c'est ennuyeux. Ajoutons une orbite subtile :

1. Sélectionnez la caméra
2. Ajoutez une contrainte **Track To** ciblant la sphère
3. Keyframez la position de la caméra à la frame 1
4. À la dernière frame, déplacez la caméra légèrement sur le côté et keyframez à nouveau

## Rendu

Avant de lancer le rendu, configurez votre output :

- **Resolution** : 1920×1080
- **Frame Rate** : 30 fps
- **Output Format** : FFmpeg Video avec encodage H.264
- **Output path** : choisissez un dossier pour la vidéo rendue

Réglez la frame de fin dans la timeline pour qu'elle corresponde à la durée de l'animation, puis appuyez sur **Ctrl+F12** pour lancer le rendu de l'animation. Selon votre matériel, ça devrait prendre quelques minutes pour un clip court.

## Astuces pour un meilleur rendu

- **Squash and stretch** : scalez la sphère légèrement à l'impact pour vendre le rebond
- **Motion blur** : activez-le dans les render settings pour un mouvement plus cinématique
- **Son** : ajoutez un son de rebond dans le Video Sequence Editor de Blender pour un fini soigné
- **Lighting** : essayez un three-point lighting setup pour plus de profondeur

C'est tout ! Vous avez maintenant une animation de base. Vous pouvez explorer plus loin avec des modèles plus complexes, des simulations physiques, voire de l'animation de personnage. La doc Blender et la communauté YouTube sont des ressources incroyables pour continuer à apprendre.
