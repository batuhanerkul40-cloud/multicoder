"""
Procedural 3D Game Model Generator: Fantasy Treasure Chest (OBJ + MTL + WebGL Viewer)
Generates high-quality low-poly geometry with proper normals, groups, and materials.
"""

import math
import os
import json

OUT_DIR = r"C:\Users\batuhan\Desktop\IDE\models\treasure_chest"
os.makedirs(OUT_DIR, exist_ok=True)

class OBJBuilder:
    def __init__(self):
        self.vertices = []
        self.normals = []
        self.uvs = []
        self.faces = [] # list of (material_name, group_name, [ (v_idx, vt_idx, vn_idx), ... ])
        self.current_material = "Default"
        self.current_group = "default"

    def use_material(self, mat_name, group_name=None):
        self.current_material = mat_name
        if group_name:
            self.current_group = group_name

    def add_vertex(self, x, y, z):
        self.vertices.append((x, y, z))
        return len(self.vertices) # 1-based

    def add_normal(self, nx, ny, nz):
        l = math.sqrt(nx*nx + ny*ny + nz*nz)
        if l > 0:
            nx, ny, nz = nx/l, ny/l, nz/l
        self.normals.append((nx, ny, nz))
        return len(self.normals)

    def add_uv(self, u, v):
        self.uvs.append((u, v))
        return len(self.uvs)

    def add_quad(self, v1, v2, v3, v4, normal=None):
        n_idx = self.add_normal(*normal) if normal else None
        # Quad as two triangles
        self.faces.append((self.current_material, self.current_group, [v1, v2, v3], n_idx))
        self.faces.append((self.current_material, self.current_group, [v1, v3, v4], n_idx))

    def add_triangle(self, v1, v2, v3, normal=None):
        n_idx = self.add_normal(*normal) if normal else None
        self.faces.append((self.current_material, self.current_group, [v1, v2, v3], n_idx))

    def add_box(self, x_min, y_min, z_min, x_max, y_max, z_max):
        # 8 vertices
        v000 = self.add_vertex(x_min, y_min, z_min)
        v100 = self.add_vertex(x_max, y_min, z_min)
        v110 = self.add_vertex(x_max, y_max, z_min)
        v010 = self.add_vertex(x_min, y_max, z_min)
        v001 = self.add_vertex(x_min, y_min, z_max)
        v101 = self.add_vertex(x_max, y_min, z_max)
        v111 = self.add_vertex(x_max, y_max, z_max)
        v011 = self.add_vertex(x_min, y_max, z_max)

        # Front (Z max)
        self.add_quad(v001, v101, v111, v011, (0, 0, 1))
        # Back (Z min)
        self.add_quad(v100, v000, v010, v110, (0, 0, -1))
        # Left (X min)
        self.add_quad(v000, v001, v011, v010, (-1, 0, 0))
        # Right (X max)
        self.add_quad(v101, v100, v110, v111, (1, 0, 0))
        # Top (Y max)
        self.add_quad(v011, v111, v110, v010, (0, 1, 0))
        # Bottom (Y min)
        self.add_quad(v000, v100, v101, v001, (0, -1, 0))

    def export_obj(self, filepath, mtl_filename):
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"# Stylized Fantasy Treasure Chest\n")
            f.write(f"mtllib {mtl_filename}\n\n")

            for v in self.vertices:
                f.write(f"v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
            f.write("\n")

            for vn in self.normals:
                f.write(f"vn {vn[0]:.4f} {vn[1]:.4f} {vn[2]:.4f}\n")
            f.write("\n")

            last_mat = None
            last_grp = None

            for mat, grp, verts, n_idx in self.faces:
                if grp != last_grp:
                    f.write(f"g {grp}\n")
                    last_grp = grp
                if mat != last_mat:
                    f.write(f"usemtl {mat}\n")
                    last_mat = mat

                if n_idx:
                    f.write(f"f {verts[0]}//{n_idx} {verts[1]}//{n_idx} {verts[2]}//{n_idx}\n")
                else:
                    f.write(f"f {verts[0]} {verts[1]} {verts[2]}\n")

def generate_chest():
    builder = OBJBuilder()

    # Dimensions
    W = 1.0   # half width (X: -1 to 1)
    D = 0.65  # half depth (Z: -0.65 to 0.65)
    H = 0.75  # base height

    # 1. BASE WOOD BODY (Outer main box)
    builder.use_material("Mat_Wood_Base", "Base_Body")
    builder.add_box(-W, 0.05, -D, W, H, D)

    # Base Feet / Skids (Dark Wood / Iron)
    builder.use_material("Mat_Iron_Trim", "Base_Feet")
    builder.add_box(-W * 0.95, 0.0, -D * 0.95, -W * 0.7, 0.08, D * 0.95)
    builder.add_box(W * 0.7, 0.0, -D * 0.95, W * 0.95, 0.08, D * 0.95)

    # 2. IRON CORNER BRACKETS & REINFORCEMENTS
    builder.use_material("Mat_Iron_Trim", "Base_Armor")
    thick = 0.04
    strip_w = 0.12

    # Vertical corner reinforcements (4 corners)
    corners = [
        (-W - thick/2, -D - thick/2),
        (W + thick/2, -D - thick/2),
        (W + thick/2, D + thick/2),
        (-W - thick/2, D + thick/2)
    ]
    cw = strip_w
    builder.add_box(-W - 0.02, 0.04, -D - 0.02, -W + cw, H + 0.02, -D + cw) # Back-Left
    builder.add_box(W - cw, 0.04, -D - 0.02, W + 0.02, H + 0.02, -D + cw)  # Back-Right
    builder.add_box(-W - 0.02, 0.04, D - cw, -W + cw, H + 0.02, D + 0.02)  # Front-Left
    builder.add_box(W - cw, 0.04, D - cw, W + 0.02, H + 0.02, D + 0.02)   # Front-Right

    # Horizontal bottom rim band
    builder.add_box(-W - 0.015, 0.05, -D - 0.015, W + 0.015, 0.14, D + 0.015)
    # Horizontal top rim band
    builder.add_box(-W - 0.015, H - 0.08, -D - 0.015, W + 0.015, H + 0.02, D + 0.015)

    # Vertical middle decorative band
    builder.add_box(-strip_w/2, 0.05, D - 0.02, strip_w/2, H + 0.02, D + 0.02)

    # 3. GOLDEN LOCK CLASP ON BASE
    builder.use_material("Mat_Gold", "Lock_Plate")
    builder.add_box(-0.14, H - 0.22, D + 0.01, 0.14, H - 0.02, D + 0.05)
    builder.use_material("Mat_Ruby", "Lock_Gem")
    builder.add_box(-0.04, H - 0.14, D + 0.04, 0.04, H - 0.06, D + 0.07)

    # Keyhole
    builder.use_material("Mat_Black_Iron", "Keyhole")
    builder.add_box(-0.015, H - 0.18, D + 0.045, 0.015, H - 0.12, D + 0.055)

    # Side Handles (Left & Right)
    builder.use_material("Mat_Gold", "Side_Handles")
    # Left handle base plate + ring
    builder.add_box(-W - 0.03, H * 0.5 - 0.08, -0.08, -W, H * 0.5 + 0.08, 0.08)
    builder.add_box(-W - 0.08, H * 0.5 - 0.12, -0.05, -W - 0.03, H * 0.5 + 0.02, 0.05)
    # Right handle
    builder.add_box(W, H * 0.5 - 0.08, -0.08, W + 0.03, H * 0.5 + 0.08, 0.08)
    builder.add_box(W + 0.03, H * 0.5 - 0.12, -0.05, W + 0.08, H * 0.5 + 0.02, 0.05)

    # 4. ARCHED LID (Barrel Vault / Stylized Facets)
    # Segments along curve
    segments = 7
    radius = D # 0.65
    lid_y_center = H # 0.75
    lid_z_center = 0.0

    builder.use_material("Mat_Wood_Lid", "Lid_Body")

    angles = [math.pi * i / segments for i in range(segments + 1)] # 0 to pi
    outer_pts = [(lid_y_center + radius * math.sin(a), lid_z_center + radius * math.cos(a)) for a in angles]

    # Curved top planks
    for i in range(segments):
        y1, z1 = outer_pts[i]
        y2, z2 = outer_pts[i+1]

        v_fl = builder.add_vertex(-W, y1, z1)
        v_fr = builder.add_vertex(W, y1, z1)
        v_br = builder.add_vertex(W, y2, z2)
        v_bl = builder.add_vertex(-W, y2, z2)

        # Normal
        ny = (y1 + y2) / 2 - lid_y_center
        nz = (z1 + z2) / 2 - lid_z_center
        builder.add_quad(v_fl, v_fr, v_br, v_bl, (0, ny, nz))

    # Lid Side Caps (End gables - semicircular fans)
    builder.use_material("Mat_Wood_Lid", "Lid_Caps")
    v_left_center = builder.add_vertex(-W, lid_y_center, lid_z_center)
    v_right_center = builder.add_vertex(W, lid_y_center, lid_z_center)

    for i in range(segments):
        y1, z1 = outer_pts[i]
        y2, z2 = outer_pts[i+1]
        # Left side cap
        vl1 = builder.add_vertex(-W, y1, z1)
        vl2 = builder.add_vertex(-W, y2, z2)
        builder.add_triangle(v_left_center, vl1, vl2, (-1, 0, 0))

        # Right side cap
        vr1 = builder.add_vertex(W, y1, z1)
        vr2 = builder.add_vertex(W, y2, z2)
        builder.add_triangle(v_right_center, vr2, vr1, (1, 0, 0))

    # 5. LID REINFORCING ARCHED STRAPS (Left, Middle, Right)
    builder.use_material("Mat_Iron_Trim", "Lid_Straps")
    strap_positions = [-W * 0.8, 0.0, W * 0.8]
    sw = 0.12
    extra_r = 0.025

    for sx in strap_positions:
        x_min = sx - sw/2
        x_max = sx + sw/2
        for i in range(segments):
            y1, z1 = outer_pts[i]
            y2, z2 = outer_pts[i+1]
            # Extrude outward slightly
            ny1, nz1 = (y1 - lid_y_center)/radius, (z1 - lid_z_center)/radius
            ny2, nz2 = (y2 - lid_y_center)/radius, (z2 - lid_z_center)/radius

            sy1, sz1 = y1 + ny1 * extra_r, z1 + nz1 * extra_r
            sy2, sz2 = y2 + ny2 * extra_r, z2 + nz2 * extra_r

            v1 = builder.add_vertex(x_min, sy1, sz1)
            v2 = builder.add_vertex(x_max, sy1, sz1)
            v3 = builder.add_vertex(x_max, sy2, sz2)
            v4 = builder.add_vertex(x_min, sy2, sz2)
            builder.add_quad(v1, v2, v3, v4, (0, (ny1+ny2)/2, (nz1+nz2)/2))

    # Lid front latch hook (Golden)
    builder.use_material("Mat_Gold", "Lid_Latch")
    builder.add_box(-0.10, H - 0.05, D + 0.02, 0.10, H + 0.14, D + 0.055)

    # 6. GLOWING TREASURE PILE (Inside ambient jewels & coins)
    builder.use_material("Mat_Gold_Coins", "Coins")
    # A few gold ingots / coin blocks
    builder.add_box(-0.6, H * 0.7, -0.3, 0.6, H * 0.9, 0.3)
    builder.add_box(-0.4, H * 0.85, -0.2, 0.4, H * 0.98, 0.2)

    # Glowing magical crystals on top
    builder.use_material("Mat_Crystal_Cyan", "Magic_Crystal")
    # Central crystal pyramid
    c_base = builder.add_vertex(0.0, H + 0.35, 0.0) # apex
    c1 = builder.add_vertex(-0.15, H * 0.9, -0.15)
    c2 = builder.add_vertex(0.15, H * 0.9, -0.15)
    c3 = builder.add_vertex(0.15, H * 0.9, 0.15)
    c4 = builder.add_vertex(-0.15, H * 0.9, 0.15)
    builder.add_triangle(c_base, c1, c2, (0, 0.8, -0.6))
    builder.add_triangle(c_base, c2, c3, (0.6, 0.8, 0))
    builder.add_triangle(c_base, c3, c4, (0, 0.8, 0.6))
    builder.add_triangle(c_base, c4, c1, (-0.6, 0.8, 0))

    # Small Ruby crystal
    builder.use_material("Mat_Ruby", "Ruby_Crystal")
    r_base = builder.add_vertex(0.35, H + 0.22, 0.1)
    r1 = builder.add_vertex(0.25, H * 0.9, 0.02)
    r2 = builder.add_vertex(0.45, H * 0.9, 0.02)
    r3 = builder.add_vertex(0.45, H * 0.9, 0.18)
    r4 = builder.add_vertex(0.25, H * 0.9, 0.18)
    builder.add_triangle(r_base, r1, r2, (0, 0.7, -0.7))
    builder.add_triangle(r_base, r2, r3, (0.7, 0.7, 0))
    builder.add_triangle(r_base, r3, r4, (0, 0.7, 0.7))
    builder.add_triangle(r_base, r4, r1, (-0.7, 0.7, 0))

    # Export
    obj_path = os.path.join(OUT_DIR, "treasure_chest.obj")
    mtl_filename = "treasure_chest.mtl"
    mtl_path = os.path.join(OUT_DIR, mtl_filename)

    builder.export_obj(obj_path, mtl_filename)

    # Write MTL file
    with open(mtl_path, "w", encoding="utf-8") as f:
        f.write("# Materials for Stylized Treasure Chest\n\n")

        # Wood Base
        f.write("newmtl Mat_Wood_Base\n")
        f.write("Kd 0.38 0.22 0.12\n") # warm oak brown
        f.write("Ka 0.10 0.06 0.03\n")
        f.write("Ks 0.15 0.15 0.15\n")
        f.write("Ns 15.0\n\n")

        # Wood Lid
        f.write("newmtl Mat_Wood_Lid\n")
        f.write("Kd 0.44 0.26 0.14\n") # slightly lighter oak
        f.write("Ka 0.10 0.06 0.03\n")
        f.write("Ks 0.15 0.15 0.15\n")
        f.write("Ns 15.0\n\n")

        # Iron Trim
        f.write("newmtl Mat_Iron_Trim\n")
        f.write("Kd 0.22 0.24 0.28\n") # cool gunmetal grey
        f.write("Ka 0.08 0.08 0.10\n")
        f.write("Ks 0.60 0.60 0.65\n")
        f.write("Ns 60.0\n\n")

        # Black Iron
        f.write("newmtl Mat_Black_Iron\n")
        f.write("Kd 0.08 0.08 0.09\n")
        f.write("Ka 0.02 0.02 0.02\n")
        f.write("Ks 0.30 0.30 0.30\n")
        f.write("Ns 40.0\n\n")

        # Polished Gold
        f.write("newmtl Mat_Gold\n")
        f.write("Kd 0.95 0.72 0.15\n") # rich gold
        f.write("Ka 0.30 0.22 0.05\n")
        f.write("Ks 0.90 0.85 0.40\n")
        f.write("Ns 90.0\n\n")

        # Gold Coins
        f.write("newmtl Mat_Gold_Coins\n")
        f.write("Kd 0.98 0.80 0.20\n")
        f.write("Ka 0.35 0.25 0.05\n")
        f.write("Ks 0.95 0.90 0.50\n")
        f.write("Ns 100.0\n\n")

        # Glowing Cyan Crystal (Emissive)
        f.write("newmtl Mat_Crystal_Cyan\n")
        f.write("Kd 0.10 0.85 0.95\n")
        f.write("Ka 0.05 0.40 0.50\n")
        f.write("Ks 0.90 0.95 1.00\n")
        f.write("Ke 0.20 0.90 1.00\n") # emissive cyan
        f.write("Ns 120.0\n")
        f.write("d 0.9\n\n")

        # Glowing Ruby Gem
        f.write("newmtl Mat_Ruby\n")
        f.write("Kd 0.95 0.10 0.25\n")
        f.write("Ka 0.40 0.05 0.10\n")
        f.write("Ks 0.95 0.60 0.70\n")
        f.write("Ke 0.85 0.05 0.20\n")
        f.write("Ns 110.0\n\n")

    print(f"OBJ oluşturuldu: {obj_path} ({len(builder.vertices)} köşe, {len(builder.faces)} üçgen)")
    print(f"MTL oluşturuldu: {mtl_path}")

    return {
        "vertices": len(builder.vertices),
        "faces": len(builder.faces),
        "obj_path": obj_path,
        "mtl_path": mtl_path
    }

if __name__ == "__main__":
    generate_chest()
