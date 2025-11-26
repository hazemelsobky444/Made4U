    <?php
    // backend/cart/get.php
    session_start();
    require_once __DIR__ . '/../db.php';
    header('Content-Type: application/json; charset=utf-8');

    if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['error'=>'unauthorized']); exit; }

    $user_id = intval($_SESSION['user_id']);
    $stmt = $conn->prepare("SELECT c.id AS cart_id, c.quantity, p.id AS product_id, p.name, p.price, p.image FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $items = $res->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode($items);
    ?>
