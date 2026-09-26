package dsa;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/** Cây nhị phân tìm kiếm (BST): thêm, tìm, 4 cách duyệt, chiều cao, kiểm tra hợp lệ. */
public class BinaryTreeDemo {

    static class TreeNode {
        int val;
        TreeNode left, right;

        TreeNode(int val) {
            this.val = val;
        }
    }

    /** Thêm vào BST: nhỏ hơn đi trái, lớn hơn đi phải. O(chiều cao). */
    static TreeNode insert(TreeNode node, int val) {
        if (node == null) return new TreeNode(val);
        if (val < node.val) node.left = insert(node.left, val);
        else if (val > node.val) node.right = insert(node.right, val);
        return node;                                 // trùng thì bỏ qua
    }

    static boolean contains(TreeNode node, int val) {
        while (node != null) {
            if (val == node.val) return true;
            node = val < node.val ? node.left : node.right;
        }
        return false;
    }

    static void preOrder(TreeNode n, List<Integer> out) {
        if (n == null) return;
        out.add(n.val);
        preOrder(n.left, out);
        preOrder(n.right, out);
    }

    static void inOrder(TreeNode n, List<Integer> out) {
        if (n == null) return;
        inOrder(n.left, out);
        out.add(n.val);
        inOrder(n.right, out);
    }

    static void postOrder(TreeNode n, List<Integer> out) {
        if (n == null) return;
        postOrder(n.left, out);
        postOrder(n.right, out);
        out.add(n.val);
    }

    /** BFS theo tầng bằng Queue. Trả về danh sách từng tầng. */
    static List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> levels = new ArrayList<>();
        if (root == null) return levels;
        Deque<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            int count = queue.size();                // số node của tầng hiện tại
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                TreeNode n = queue.poll();
                level.add(n.val);
                if (n.left != null) queue.offer(n.left);
                if (n.right != null) queue.offer(n.right);
            }
            levels.add(level);
        }
        return levels;
    }

    static int height(TreeNode n) {
        if (n == null) return 0;
        return 1 + Math.max(height(n.left), height(n.right));
    }

    /**
     * Bẫy kinh điển: chỉ so node với con trực tiếp là SAI.
     * Phải truyền xuống khoảng (min, max) hợp lệ cho cả cây con.
     */
    static boolean isValidBst(TreeNode n, long min, long max) {
        if (n == null) return true;
        if (n.val <= min || n.val >= max) return false;
        return isValidBst(n.left, min, n.val) && isValidBst(n.right, n.val, max);
    }

    /** Tổ tiên chung thấp nhất trong BST: tách nhánh ở đâu thì đó là đáp án. */
    static int lowestCommonAncestor(TreeNode root, int p, int q) {
        TreeNode cur = root;
        while (cur != null) {
            if (p < cur.val && q < cur.val) cur = cur.left;
            else if (p > cur.val && q > cur.val) cur = cur.right;
            else return cur.val;
        }
        throw new IllegalArgumentException("Không có trong cây");
    }

    static void print(TreeNode n, String prefix, boolean isLeft) {
        if (n == null) return;
        print(n.right, prefix + (isLeft ? "│   " : "    "), false);
        System.out.println(prefix + (isLeft ? "└── " : "┌── ") + n.val);
        print(n.left, prefix + (isLeft ? "    " : "│   "), true);
    }

    public static void main(String[] args) {
        TreeNode root = null;
        for (int v : new int[]{8, 3, 10, 1, 6, 14, 4, 7}) root = insert(root, v);

        System.out.println("Cây (xoay ngang, gốc bên trái):");
        print(root, "", true);

        List<Integer> pre = new ArrayList<>(), in = new ArrayList<>(), post = new ArrayList<>();
        preOrder(root, pre);
        inOrder(root, in);
        postOrder(root, post);
        System.out.println("\nPre-order  : " + pre);
        System.out.println("In-order   : " + in + "   <- BST duyệt in-order ra dãy đã sắp xếp");
        System.out.println("Post-order : " + post);
        System.out.println("Level-order: " + levelOrder(root));
        System.out.println("Chiều cao  : " + height(root));
        System.out.println("contains(6)=" + contains(root, 6) + ", contains(5)=" + contains(root, 5));
        System.out.println("BST hợp lệ? " + isValidBst(root, Long.MIN_VALUE, Long.MAX_VALUE));
        System.out.println("Tổ tiên chung của 4 và 7 = " + lowestCommonAncestor(root, 4, 7));

        // Cây lệch: thêm theo thứ tự tăng dần -> thành đường thẳng, tìm kiếm O(n)
        TreeNode skewed = null;
        for (int v = 1; v <= 1000; v++) skewed = insert(skewed, v);
        System.out.println("\nThêm 1..1000 theo thứ tự -> chiều cao = " + height(skewed)
                + " (cây cân bằng chỉ cao ~10). Vì thế TreeMap dùng cây đỏ-đen tự cân bằng.");

        TreeNode wrong = new TreeNode(5);
        wrong.left = new TreeNode(3);
        wrong.right = new TreeNode(8);
        wrong.right.left = new TreeNode(4);          // 4 < 5 nhưng nằm bên phải của 5
        System.out.println("Cây 5-(3, 8-(4)) là BST hợp lệ? "
                + isValidBst(wrong, Long.MIN_VALUE, Long.MAX_VALUE));
    }
}
