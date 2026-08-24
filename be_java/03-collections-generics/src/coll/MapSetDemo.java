package coll;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

/** Map & Set: thứ tự, đếm tần suất, gom nhóm, và bẫy key mutable. */
public class MapSetDemo {

    record Student(String name, String className, double gpa) { }

    public static void main(String[] args) {
        setThuTu();
        mapThuTu();
        demTanSuat();
        gomNhom();
        sapXepMapTheoValue();
        bayKeyMutable();
        pheptapHop();
    }

    static void setThuTu() {
        System.out.println("--- Set: thứ tự ---");
        List<String> src = List.of("banana", "apple", "cherry", "apple");
        System.out.println("HashSet       : " + new HashSet<>(src));
        System.out.println("LinkedHashSet : " + new LinkedHashSet<>(src) + "  (giữ thứ tự thêm)");
        System.out.println("TreeSet       : " + new TreeSet<>(src) + "  (đã sắp xếp)");

        TreeSet<Integer> ts = new TreeSet<>(List.of(5, 1, 9, 3));
        System.out.println("TreeSet first/last/ceiling(4) : " + ts.first() + " / " + ts.last() + " / " + ts.ceiling(4));
    }

    static void mapThuTu() {
        System.out.println("\n--- Map: thứ tự ---");
        Map<String, Integer> hash = new HashMap<>();
        Map<String, Integer> linked = new LinkedHashMap<>();
        Map<String, Integer> tree = new TreeMap<>();
        for (Map<String, Integer> m : List.of(hash, linked, tree)) {
            m.put("banana", 2); m.put("apple", 5); m.put("cherry", 1);
        }
        System.out.println("HashMap       : " + hash);
        System.out.println("LinkedHashMap : " + linked);
        System.out.println("TreeMap       : " + tree);

        System.out.println("get(\"zzz\")            = " + hash.get("zzz"));
        System.out.println("getOrDefault(\"zzz\",0) = " + hash.getOrDefault("zzz", 0));
    }

    static void demTanSuat() {
        System.out.println("\n--- Đếm tần suất bằng merge ---");
        String text = "java spring java boot spring java";
        Map<String, Integer> count = new HashMap<>();
        for (String w : text.split(" ")) {
            count.merge(w, 1, Integer::sum);
        }
        System.out.println(count);
    }

    static void gomNhom() {
        System.out.println("\n--- Gom nhóm bằng computeIfAbsent ---");
        List<Student> students = List.of(
                new Student("An", "K15A", 8.5),
                new Student("Binh", "K15B", 7.0),
                new Student("Cuong", "K15A", 9.1),
                new Student("Dung", "K15B", 6.2));

        Map<String, List<Student>> byClass = new LinkedHashMap<>();
        for (Student s : students) {
            byClass.computeIfAbsent(s.className(), k -> new ArrayList<>()).add(s);
        }
        byClass.forEach((k, v) -> System.out.println(k + " -> " + v.stream().map(Student::name).toList()));
    }

    static void sapXepMapTheoValue() {
        System.out.println("\n--- Sắp xếp Map theo value giảm dần ---");
        Map<String, Integer> count = Map.of("java", 3, "spring", 2, "boot", 1);
        count.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .forEach(e -> System.out.println("  " + e.getKey() + ": " + e.getValue()));

        System.out.println("Top 1: " + count.entrySet().stream()
                .max(Comparator.comparingInt(Map.Entry::getValue)).orElseThrow());
    }

    /** Bẫy nguy hiểm: dùng object mutable làm key rồi sửa nó. */
    static void bayKeyMutable() {
        System.out.println("\n--- Bẫy: key mutable ---");
        class MutableKey {
            String id;
            MutableKey(String id) { this.id = id; }
            @Override public boolean equals(Object o) {
                return o instanceof MutableKey k && k.id.equals(id);
            }
            @Override public int hashCode() { return id.hashCode(); }
            @Override public String toString() { return "Key(" + id + ")"; }
        }

        Map<MutableKey, String> map = new HashMap<>();
        MutableKey key = new MutableKey("A");
        map.put(key, "giá trị");
        System.out.println("Trước khi sửa key : " + map.get(key));
        key.id = "B";                       // hash đổi -> không tìm được nữa
        System.out.println("Sau khi sửa key   : " + map.get(key) + "  <- dữ liệu bị 'mất'");
        System.out.println("Nội dung map vẫn  : " + map);
        System.out.println("=> Key phải là immutable (String, Integer, record, UUID...)");
    }

    static void pheptapHop() {
        System.out.println("\n--- Phép tập hợp ---");
        Set<String> a = new HashSet<>(List.of("a", "b", "c"));
        Set<String> b = Set.of("b", "c", "d");

        Set<String> giao = new HashSet<>(a); giao.retainAll(b);
        Set<String> hop = new HashSet<>(a); hop.addAll(b);
        Set<String> hieu = new HashSet<>(a); hieu.removeAll(b);

        System.out.println("giao = " + giao + ", hợp = " + hop + ", hiệu = " + hieu);
    }
}
