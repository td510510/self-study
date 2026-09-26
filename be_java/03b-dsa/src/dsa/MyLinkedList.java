package dsa;

/** Tự cài singly linked list và 4 bài kinh điển: đảo ngược, tìm giữa, phát hiện vòng, trộn. */
public class MyLinkedList {

    static class Node {
        int val;
        Node next;

        Node(int val) {
            this.val = val;
        }
    }

    private Node head;
    private int size;

    /** Thêm đầu: O(1). */
    public void addFirst(int val) {
        Node node = new Node(val);
        node.next = head;
        head = node;
        size++;
    }

    /** Thêm cuối: O(n) vì phải đi tới cuối (LinkedList của Java giữ thêm con trỏ tail nên là O(1)). */
    public void addLast(int val) {
        Node node = new Node(val);
        if (head == null) {
            head = node;
        } else {
            Node cur = head;
            while (cur.next != null) cur = cur.next;
            cur.next = node;
        }
        size++;
    }

    /** Truy cập theo chỉ số: O(n) — điểm yếu lớn nhất so với mảng. */
    public int get(int index) {
        if (index < 0 || index >= size) throw new IndexOutOfBoundsException(index);
        Node cur = head;
        for (int i = 0; i < index; i++) cur = cur.next;
        return cur.val;
    }

    public boolean remove(int val) {
        Node dummy = new Node(0);                   // node giả đứng trước head: khỏi xử lý riêng trường hợp xóa head
        dummy.next = head;
        Node prev = dummy;
        while (prev.next != null) {
            if (prev.next.val == val) {
                prev.next = prev.next.next;
                head = dummy.next;
                size--;
                return true;
            }
            prev = prev.next;
        }
        return false;
    }

    @Override
    public String toString() {
        return toString(head);
    }

    static String toString(Node head) {
        StringBuilder sb = new StringBuilder("[");
        for (Node cur = head; cur != null; cur = cur.next) {
            sb.append(cur.val);
            if (cur.next != null) sb.append(" -> ");
        }
        return sb.append("]").toString();
    }

    // ============================================================ BÀI KINH ĐIỂN

    static Node reverse(Node head) {
        Node prev = null, cur = head;
        while (cur != null) {
            Node next = cur.next;
            cur.next = prev;
            prev = cur;
            cur = next;
        }
        return prev;
    }

    /** Con trỏ nhanh đi 2 bước, chậm đi 1 bước. */
    static Node middle(Node head) {
        Node slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }

    /** Thuật toán Floyd: có vòng thì nhanh sẽ đuổi kịp chậm. O(n) thời gian, O(1) bộ nhớ. */
    static boolean hasCycle(Node head) {
        Node slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }

    static Node mergeSorted(Node a, Node b) {
        Node dummy = new Node(0), tail = dummy;
        while (a != null && b != null) {
            if (a.val <= b.val) { tail.next = a; a = a.next; }
            else { tail.next = b; b = b.next; }
            tail = tail.next;
        }
        tail.next = (a != null) ? a : b;
        return dummy.next;
    }

    static Node of(int... values) {
        Node dummy = new Node(0), tail = dummy;
        for (int v : values) {
            tail.next = new Node(v);
            tail = tail.next;
        }
        return dummy.next;
    }

    public static void main(String[] args) {
        MyLinkedList list = new MyLinkedList();
        list.addLast(2);
        list.addLast(3);
        list.addFirst(1);
        list.addLast(4);
        System.out.println("Danh sách: " + list + ", size = " + list.size + ", get(2) = " + list.get(2));
        list.remove(1);
        System.out.println("Sau khi xóa 1: " + list);

        Node head = of(1, 2, 3, 4, 5);
        System.out.println("\nPhần tử giữa của " + toString(head) + " = " + middle(head).val);
        System.out.println("Đảo ngược: " + toString(reverse(head)));

        Node cyclic = of(1, 2, 3, 4);
        cyclic.next.next.next.next = cyclic.next;       // 4 -> 2 tạo vòng
        System.out.println("\nCó vòng? " + hasCycle(cyclic));
        System.out.println("Không vòng? " + hasCycle(of(1, 2, 3)));

        System.out.println("\nTrộn [1,4,7] và [2,3,8] = " + toString(mergeSorted(of(1, 4, 7), of(2, 3, 8))));
    }
}
