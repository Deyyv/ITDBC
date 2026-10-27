import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import {
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  IcosahedronGeometry,
  LatheGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector2,
  type Group,
} from 'three'
import {
  ITEM_CLEARANCE_MM,
  ITEM_COLORS,
  ITEM_REST_Y_MM,
  MM_TO_UNITS,
} from '../../lib/basket/config'
import { advanceItem, pileTarget, spawnBody, type Body } from '../../lib/basket/itemPhysics'
import { mulberry32 } from '../../lib/basket/rng'
import type { DepositItem, MaterialId, Vec3 } from '../../lib/basket/types'

const VARIANTS = 4

function profile(points: readonly (readonly [number, number])[]): Vector2[] {
  return points.map(([radius, height]) => new Vector2(radius, height))
}

/** Bottle lying on its side, axis along X. */
function createBottleGeometry(): BufferGeometry {
  const geometry = new LatheGeometry(
    profile([
      [0, -95],
      [22, -95],
      [28, -88],
      [30, -70],
      [30, 20],
      [28, 42],
      [19, 60],
      [11.5, 72],
      [11, 92],
      [13.5, 94],
      [13.5, 99],
      [0, 99],
    ]),
    24,
  )
  geometry.rotateZ(Math.PI / 2)
  return geometry
}

/** Jug lying on its side, axis along X. */
function createJugGeometry(): BufferGeometry {
  const geometry = new LatheGeometry(
    profile([
      [0, -82],
      [46, -82],
      [50, -72],
      [50, 30],
      [46, 50],
      [28, 70],
      [20, 82],
      [20, 96],
      [24, 98],
      [24, 104],
      [0, 104],
    ]),
    24,
  )
  geometry.rotateZ(Math.PI / 2)
  return geometry
}

function createCapGeometry(): BufferGeometry {
  return new CylinderGeometry(14, 14, 9, 18)
}

/** Deformed icosphere: a crumpled bag. The displacement depends on position, so seams stay shut. */
function createBagGeometry(variant: number): BufferGeometry {
  const geometry = new IcosahedronGeometry(1, 2)
  const rng = mulberry32(900 + variant * 37)
  const phases = Array.from({ length: 6 }, () => rng() * Math.PI * 2)
  const position = geometry.attributes.position
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index)
    const y = position.getY(index)
    const z = position.getZ(index)
    const bump =
      0.16 * Math.sin(x * 3.1 + phases[0]) * Math.cos(y * 2.7 + phases[1]) +
      0.12 * Math.sin(z * 3.7 + phases[2]) +
      0.08 * Math.sin((x + y + z) * 4.3 + phases[3])
    const scale = 52 * (1 + bump)
    position.setXYZ(index, x * scale, y * scale * 0.7, z * scale * 1.1)
  }
  geometry.computeVertexNormals()
  return geometry
}

type ItemAssets = {
  geometries: Record<MaterialId, BufferGeometry[]>
  materials: Record<MaterialId, (MeshStandardMaterial | MeshPhysicalMaterial)[]>
}

function createAssets(): ItemAssets {
  const bottle = createBottleGeometry()
  const jug = createJugGeometry()
  const cap = createCapGeometry()
  const bags = Array.from({ length: VARIANTS }, (_, index) => createBagGeometry(index))

  const pet = new MeshPhysicalMaterial({
    color: ITEM_COLORS.pet,
    transparent: true,
    opacity: 0.62,
    roughness: 0.12,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    side: DoubleSide,
    depthWrite: false,
  })

  return {
    geometries: {
      pet: [bottle],
      hdpe: [jug],
      tapas: [cap],
      mixta: bags,
    },
    materials: {
      pet: [pet],
      hdpe: ITEM_COLORS.hdpe.map((color) => new MeshStandardMaterial({ color, roughness: 0.45 })),
      tapas: ITEM_COLORS.caps.map((color) => new MeshStandardMaterial({ color, roughness: 0.4 })),
      mixta: ITEM_COLORS.bags.map(
        (color) =>
          new MeshStandardMaterial({
            color,
            roughness: 0.6,
            transparent: true,
            opacity: 0.9,
            side: DoubleSide,
          }),
      ),
    },
  }
}

function useItemAssets(): ItemAssets {
  const assets = useMemo(createAssets, [])
  useEffect(
    () => () => {
      for (const list of Object.values(assets.geometries)) list.forEach((item) => item.dispose())
      for (const list of Object.values(assets.materials)) list.forEach((item) => item.dispose())
    },
    [assets],
  )
  return assets
}

type ItemMeshProps = {
  item: DepositItem
  slot: Vec3 | undefined
  assets: ItemAssets
  servoRef: MutableRefObject<number>
  reducedMotion: boolean
}

function ItemMesh({ item, slot, assets, servoRef, reducedMotion }: ItemMeshProps) {
  const group = useRef<Group>(null)
  const bodyRef = useRef<Body | null>(null)
  if (bodyRef.current === null) {
    bodyRef.current = spawnBody(item.seed, ITEM_CLEARANCE_MM[item.materialId])
  }

  const restMm = ITEM_REST_Y_MM[item.materialId]

  useFrame((_, delta) => {
    const body = bodyRef.current
    const node = group.current
    if (!body || !node) return

    advanceItem(body, {
      state: item.state,
      slot,
      deltaS: delta,
      servoDeg: servoRef.current,
      restMm,
      reducedMotion,
    })

    node.position.set(body.x, body.y, body.z)
    node.rotation.set(body.rx, body.ry, body.rz)
  })

  const variant = item.seed % VARIANTS
  const geometries = assets.geometries[item.materialId]
  const materials = assets.materials[item.materialId]

  return (
    <group ref={group}>
      <mesh
        geometry={geometries[variant % geometries.length]}
        material={materials[variant % materials.length]}
        castShadow
        raycast={() => null}
      />
    </group>
  )
}

type DepositedItemsProps = {
  items: readonly DepositItem[]
  /** True fill level the pile settles to (percent). */
  fillPct: number
  servoRef: MutableRefObject<number>
  reducedMotion: boolean
}

/** Procedural plastic items with simple gravity, bounces and a pile that follows the fill level. */
export default function DepositedItems({
  items,
  fillPct,
  servoRef,
  reducedMotion,
}: DepositedItemsProps) {
  const assets = useItemAssets()
  const quantizedFill = Math.round(fillPct * 2) / 2

  const slots = useMemo(() => {
    const pile = items.filter((item) => item.state === 'dumping' || item.state === 'settled')
    const map = new Map<number, Vec3>()
    pile.forEach((item, index) => {
      map.set(item.id, pileTarget(index, pile.length, quantizedFill, item.seed, ITEM_REST_Y_MM[item.materialId]))
    })
    return map
  }, [items, quantizedFill])

  return (
    <group scale={MM_TO_UNITS}>
      {items.map((item) => (
        <ItemMesh
          key={item.id}
          item={item}
          slot={slots.get(item.id)}
          assets={assets}
          servoRef={servoRef}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  )
}
