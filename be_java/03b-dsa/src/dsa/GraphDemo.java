package dsa;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;

/** Đồ thị: BFS (đường ngắn nhất), DFS (đếm vùng), sắp xếp topo (thứ tự phụ thuộc), Dijkstra. */
public class GraphDemo {

    public static void main(String[] args) {
        System.out.println("--- BFS: mạng bạn bè, ai cách An mấy bước? ---");
        Map<String, List<String>> friends = new HashMap<>();
        addUndirected(friends, "An", "Bình");
        addUndirected(friends, "An", "Chi");
        addUndirected(friends, "Bình", "Dũng");
        addUndirected(friends, "Chi", "Dũng");
        addUndirected(friends, "Dũng", "Em");
        addUndirected(friends, "Giang", "Hà");       // nhóm tách biệt
        System.out.println(bfsDistance(friends, "An"));
        System.out.println("Đường đi An -> Em: " + shortestPath(friends, "An", "Em"));

        System.out.println("\n--- DFS: đếm số đảo (1 = đất, 0 = nước) ---");
        char[][] grid = {
                "11000".toCharArray(),
                "11000".toCharArray(),
                "00100".toCharArray(),
                "00011".toCharArray()};
        System.out.println("Số đảo = " + countIslands(grid));

        System.out.println("\n--- Sắp xếp topo: thứ tự khởi tạo bean trong Spring ---");
        // cạnh A -> B nghĩa là "A phải có trước B" (B phụ thuộc A)
        Map<String, List<String>> deps = new LinkedHashMap<>();
        addEdge(deps, "DataSource", "UserRepository");
        addEdge(deps, "DataSource", "OrderRepository");
        addEdge(deps, "UserRepository", "UserService");
        addEdge(deps, "OrderRepository", "OrderService");
        addEdge(deps, "UserService", "OrderService");
        addEdge(deps, "OrderService", "OrderController");
        System.out.println("Thứ tự tạo: " + topologicalSort(deps));

        addEdge(deps, "OrderService", "UserService");  // tạo chu trình UserService <-> OrderService
        System.out.println("Thêm UserService phụ thuộc OrderService: " + topologicalSort(deps));

        System.out.println("\n--- Dijkstra: phí ship rẻ nhất giữa các kho ---");
        Map<String, Map<String, Integer>> roads = new HashMap<>();
        addWeighted(roads, "HN", "HP", 30);
        addWeighted(roads, "HN", "ND", 20);
        addWeighted(roads, "ND", "HP", 5);
        addWeighted(roads, "HP", "QN", 15);
        addWeighted(roads, "ND", "QN", 40);
        System.out.println("Chi phí nhỏ nhất từ HN: " + dijkstra(roads, "HN"));
    }

    static void addUndirected(Map<String, List<String>> g, String a, String b) {
        g.computeIfAbsent(a, k -> new ArrayList<>()).add(b);
        g.computeIfAbsent(b, k -> new ArrayList<>()).add(a);
    }

    static void addEdge(Map<String, List<String>> g, String from, String to) {
        g.computeIfAbsent(from, k -> new ArrayList<>()).add(to);
        g.computeIfAbsent(to, k -> new ArrayList<>());
    }

    static void addWeighted(Map<String, Map<String, Integer>> g, String a, String b, int w) {
        g.computeIfAbsent(a, k -> new HashMap<>()).put(b, w);
        g.computeIfAbsent(b, k -> new HashMap<>()).put(a, w);
    }

    static Map<String, Integer> bfsDistance(Map<String, List<String>> g, String start) {
        Map<String, Integer> dist = new LinkedHashMap<>();
        Deque<String> queue = new ArrayDeque<>();
        dist.put(start, 0);
        queue.offer(start);
        while (!queue.isEmpty()) {
            String cur = queue.poll();
            for (String next : g.getOrDefault(cur, List.of())) {
                if (!dist.containsKey(next)) {
                    dist.put(next, dist.get(cur) + 1);
                    queue.offer(next);
                }
            }
        }
        return dist;                                  // Giang, Hà không có mặt: không tới được
    }

    /** BFS + ghi lại "đến đây từ đâu" để dựng lại đường đi. */
    static List<String> shortestPath(Map<String, List<String>> g, String from, String to) {
        Map<String, String> parent = new HashMap<>();
        Deque<String> queue = new ArrayDeque<>();
        parent.put(from, null);
        queue.offer(from);
        while (!queue.isEmpty()) {
            String cur = queue.poll();
            if (cur.equals(to)) break;
            for (String next : g.getOrDefault(cur, List.of())) {
                if (!parent.containsKey(next)) {
                    parent.put(next, cur);
                    queue.offer(next);
                }
            }
        }
        if (!parent.containsKey(to)) return List.of();
        List<String> path = new ArrayList<>();
        for (String at = to; at != null; at = parent.get(at)) path.add(0, at);
        return path;
    }

    static int countIslands(char[][] grid) {
        int count = 0;
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == '1') {
                    count++;
                    sink(grid, r, c);                 // xóa cả hòn đảo để không đếm lại
                }
            }
        }
        return count;
    }

    static void sink(char[][] grid, int r, int c) {
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] != '1') return;
        grid[r][c] = '0';                             // đánh dấu đã thăm
        sink(grid, r + 1, c);
        sink(grid, r - 1, c);
        sink(grid, r, c + 1);
        sink(grid, r, c - 1);
    }

    /** Thuật toán Kahn. Trả về danh sách rỗng kèm thông báo nếu có chu trình. */
    static List<String> topologicalSort(Map<String, List<String>> g) {
        Map<String, Integer> inDegree = new LinkedHashMap<>();
        for (String node : g.keySet()) inDegree.putIfAbsent(node, 0);
        for (List<String> targets : g.values())
            for (String t : targets) inDegree.merge(t, 1, Integer::sum);

        Deque<String> queue = new ArrayDeque<>();
        inDegree.forEach((node, d) -> { if (d == 0) queue.offer(node); });

        List<String> order = new ArrayList<>();
        while (!queue.isEmpty()) {
            String cur = queue.poll();
            order.add(cur);
            for (String next : g.getOrDefault(cur, List.of())) {
                if (inDegree.merge(next, -1, Integer::sum) == 0) queue.offer(next);
            }
        }
        if (order.size() < inDegree.size()) {
            Set<String> stuck = new HashSet<>(inDegree.keySet());
            order.forEach(stuck::remove);
            System.out.println("  !! Không xếp được " + stuck
                    + ": có chu trình trong nhóm này (hoặc phụ thuộc vào chu trình)."
                    + " Spring sẽ báo BeanCurrentlyInCreationException");
            return List.of();
        }
        return order;
    }

    record Entry(String node, int cost) { }

    /** Luôn mở rộng đỉnh có chi phí nhỏ nhất hiện tại. Chỉ đúng khi mọi cạnh có trọng số >= 0. */
    static Map<String, Integer> dijkstra(Map<String, Map<String, Integer>> g, String start) {
        Map<String, Integer> best = new HashMap<>();
        PriorityQueue<Entry> heap = new PriorityQueue<>(Comparator.comparingInt(Entry::cost));
        heap.offer(new Entry(start, 0));
        while (!heap.isEmpty()) {
            Entry cur = heap.poll();
            if (best.containsKey(cur.node())) continue;   // đã chốt với chi phí nhỏ hơn
            best.put(cur.node(), cur.cost());
            g.getOrDefault(cur.node(), Map.of()).forEach((next, w) -> {
                if (!best.containsKey(next)) heap.offer(new Entry(next, cur.cost() + w));
            });
        }
        return best;
    }
}
