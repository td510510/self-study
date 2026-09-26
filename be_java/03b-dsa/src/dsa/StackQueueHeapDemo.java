package dsa;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

/** Stack, Queue, monotonic stack và Heap (PriorityQueue) qua các bài kinh điển. */
public class StackQueueHeapDemo {

    public static void main(String[] args) {
        System.out.println("--- Stack ---");
        for (String s : List.of("{[()]}", "([)]", "((", "")) {
            System.out.printf("'%s' hợp lệ? %b%n", s, isValidBrackets(s));
        }
        System.out.println("Tính '3 4 + 2 *' (ký pháp Ba Lan ngược) = " + evalRpn("3 4 + 2 *"));

        System.out.println("\n--- Monotonic stack ---");
        int[] temps = {73, 74, 75, 71, 69, 72, 76, 73};
        System.out.println("Nhiệt độ " + Arrays.toString(temps));
        System.out.println("Số ngày chờ ấm hơn " + Arrays.toString(dailyTemperatures(temps)));

        System.out.println("\n--- Heap: Top K ---");
        int[] nums = {5, 1, 9, 3, 7, 2, 8, 6, 4};
        System.out.println("3 số lớn nhất của " + Arrays.toString(nums) + " = " + topK(nums, 3));
        List<String> orders = List.of("áo", "quần", "áo", "giày", "áo", "quần", "mũ", "giày", "áo", "quần");
        System.out.println("2 sản phẩm bán chạy nhất = " + topKFrequent(orders, 2));

        System.out.println("\n--- Heap: trộn K danh sách đã sắp xếp (như trộn log từ nhiều server) ---");
        List<List<Integer>> logs = List.of(List.of(1, 4, 9), List.of(2, 3, 10), List.of(5, 6, 7));
        System.out.println(mergeKSorted(logs));
    }

    static boolean isValidBrackets(String s) {
        Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (pairs.containsValue(c)) {
                stack.push(c);
            } else if (pairs.containsKey(c)) {
                if (stack.isEmpty() || stack.pop() != pairs.get(c)) return false;
            }
        }
        return stack.isEmpty();                     // còn ngoặc mở chưa đóng -> sai
    }

    static int evalRpn(String expr) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String token : expr.split(" ")) {
            switch (token) {
                case "+" -> stack.push(stack.pop() + stack.pop());
                case "*" -> stack.push(stack.pop() * stack.pop());
                case "-" -> { int b = stack.pop(), a = stack.pop(); stack.push(a - b); }
                case "/" -> { int b = stack.pop(), a = stack.pop(); stack.push(a / b); }
                default -> stack.push(Integer.parseInt(token));
            }
        }
        return stack.pop();
    }

    /** Stack giữ chỉ số các ngày "đang chờ", nhiệt độ giảm dần từ đáy lên đỉnh. O(n). */
    static int[] dailyTemperatures(int[] t) {
        int[] result = new int[t.length];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < t.length; i++) {
            while (!stack.isEmpty() && t[i] > t[stack.peek()]) {
                int j = stack.pop();
                result[j] = i - j;
            }
            stack.push(i);
        }
        return result;
    }

    /** Min-heap giữ k phần tử lớn nhất. O(n log k) thời gian, O(k) bộ nhớ. */
    static List<Integer> topK(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int x : nums) {
            heap.offer(x);
            if (heap.size() > k) heap.poll();
        }
        List<Integer> result = new ArrayList<>(heap);
        result.sort(Comparator.reverseOrder());
        return result;
    }

    static List<String> topKFrequent(List<String> items, int k) {
        Map<String, Integer> count = new HashMap<>();
        for (String item : items) count.merge(item, 1, Integer::sum);

        PriorityQueue<Map.Entry<String, Integer>> heap =
                new PriorityQueue<>(Map.Entry.comparingByValue());
        for (Map.Entry<String, Integer> e : count.entrySet()) {
            heap.offer(e);
            if (heap.size() > k) heap.poll();
        }
        List<String> result = new ArrayList<>();
        while (!heap.isEmpty()) result.add(0, heap.poll().getKey());
        return result;
    }

    record Cursor(int value, int listIndex, int position) { }

    /** Heap luôn chứa phần tử đầu của mỗi danh sách. O(N log k), N = tổng số phần tử. */
    static List<Integer> mergeKSorted(List<List<Integer>> lists) {
        PriorityQueue<Cursor> heap = new PriorityQueue<>(Comparator.comparingInt(Cursor::value));
        for (int i = 0; i < lists.size(); i++) {
            if (!lists.get(i).isEmpty()) heap.offer(new Cursor(lists.get(i).get(0), i, 0));
        }
        List<Integer> result = new ArrayList<>();
        while (!heap.isEmpty()) {
            Cursor c = heap.poll();
            result.add(c.value());
            List<Integer> source = lists.get(c.listIndex());
            if (c.position() + 1 < source.size()) {
                heap.offer(new Cursor(source.get(c.position() + 1), c.listIndex(), c.position() + 1));
            }
        }
        return result;
    }
}
